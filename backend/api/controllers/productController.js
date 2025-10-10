const db = require('../config/database');
const path = require('path');
const { uploadFileToR2, deleteFileFromR2 } = require('../utils/cloudflareR2'); // Import R2 utilities
const { shouldDisplayProducts, getISTTimeInfo } = require('../utils/timeUtils'); // Import time utilities

/**
 * Helper function to calculate stock status based on available stock
 * @param {number} availableStock - The available stock quantity
 * @returns {string} - The calculated stock status
 */
const calculateStockStatus = (availableStock) => {
    const stock = parseInt(availableStock, 10);
    
    if (stock === 0) {
        return 'out_of_stock';
    } else if (stock <= 80) {
        return 'low';
    } else {
        return 'available';
    }
};

/**
 * Calculates the next sequential ID for a product (e.g., P_001, P_002).
 * MUST be called within a transaction that has locked the 'product' table.
 */
const getNextProductId = async (client) => {
    const query = "SELECT product_id FROM product ORDER BY CAST(SUBSTRING(product_id FROM 3) AS INTEGER) DESC LIMIT 1";
    const { rows } = await client.query(query);

    if (rows.length === 0) {
        return 'P_001';
    }
    const lastNumber = parseInt(rows[0].product_id.split('_')[1], 10);
    return `P_${String(lastNumber + 1).padStart(3, '0')}`;
};

/**
 * CREATE: Add a new product and upload its image to Cloudflare R2.
 */
exports.addProduct = async (req, res) => {
    const { paper_type, size, gsm, price_per_slot, available_stock, selling_price, selling_price_2, selling_price_3 } = req.body;
    const productImageFile = req.file;

    if (!paper_type || !price_per_slot || !available_stock || !productImageFile) {
        return res.status(400).json({ message: 'Paper Type, Price, Stock, and an Image are required.' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('LOCK TABLE product IN EXCLUSIVE MODE');

        const product_id = await getNextProductId(client);
        const newFilename = `${product_id}${path.extname(productImageFile.originalname)}`;

        // Upload the file to R2 and get the full public URL.
        const product_image_url = await uploadFileToR2(productImageFile, 'products', newFilename);

        const stock_status = calculateStockStatus(available_stock);
        
        const query = `
            INSERT INTO product (product_id, paper_type, product_image_url, size, gsm, price_per_slot, selling_price, selling_price_2, selling_price_3, stock_status, available_stock, last_updated)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) RETURNING *;
        `;
        const params = [product_id, paper_type, product_image_url, size, gsm, price_per_slot, selling_price, selling_price_2 || selling_price, selling_price_3 || selling_price, stock_status, available_stock];
        const { rows } = await client.query(query, params);
        
        // No more local file system operations needed.
        await client.query('COMMIT');
        res.status(201).json(rows[0]);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error adding product:', error);
        res.status(500).json({ message: 'Failed to add product.' });
    } finally {
        client.release();
    }
};

/**
 * DELETE: Remove a product from the database and its image from Cloudflare R2.
 */
exports.deleteProduct = async (req, res) => {
    const { productId } = req.params;
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Check if the product has associated sales records.
        const tradeCheck = await client.query('SELECT 1 FROM trading WHERE product_id = $1 LIMIT 1', [productId]);
        if (tradeCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: 'Cannot delete product because it has associated sales records. Consider setting its stock to zero instead.' });
        }

        // Get the product's image URL before deleting the DB record.
        const productRes = await client.query('SELECT product_image_url FROM product WHERE product_id = $1', [productId]);
        const productToDelete = productRes.rows[0];

        // Delete the product from the database.
        const deleteResult = await client.query('DELETE FROM product WHERE product_id = $1', [productId]);

        if (deleteResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Product not found.' });
        }

        // If an image URL exists, delete the corresponding file from R2.
        if (productToDelete && productToDelete.product_image_url) {
            await deleteFileFromR2(productToDelete.product_image_url);
        }
        
        await client.query('COMMIT');
        res.status(200).json({ message: 'Product deleted successfully.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Error deleting product ${productId}:`, error);
        res.status(500).json({ message: 'Failed to delete product.' });
    } finally {
        client.release();
    }
};

// =================================================================
// --- NO CHANGES NEEDED FOR THE FOLLOWING FUNCTIONS ---
// =================================================================

/**
 * READ: Get a list of all products for the admin panel.
 */
exports.getAllProducts = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM product ORDER BY CAST(SUBSTRING(product_id FROM 3) AS INTEGER) ASC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('❌ Error fetching products:', error);
        res.status(500).json({ message: 'Failed to fetch products.' });
    }
};

/**
 * READ: Get all products with available stock for vendors to purchase.
 * Products are only available during configured business hours (IST).
 * Vendors with product_visibility = FALSE will not see any products.
 */
exports.getAvailableProducts = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const userRole = req.user.role;
        
        // Check vendor visibility (only for vendors, not for admins/coordinators)
        if (userRole === 'vendor') {
            const visibilityCheck = await db.query(
                'SELECT product_visibility FROM vendors WHERE id = $1', 
                [userId]
            );
            
            if (visibilityCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Vendor not found.',
                    products: []
                });
            }
            
            const isVisible = visibilityCheck.rows[0].product_visibility;
            
            if (!isVisible) {
                console.log(`🚫 Product visibility disabled for vendor ${userId}`);
                return res.status(200).json({
                    success: true,
                    message: 'No products available at the moment.',
                    products: [],
                    timeInfo: {
                        currentTime: getISTTimeInfo().currentTimeString,
                        timezone: 'IST (UTC+05:30)'
                    }
                });
            }
        }
        
        // Check if products should be displayed based on IST time
        const isAllowed = shouldDisplayProducts();
        const timeInfo = getISTTimeInfo();
        
        console.log('🕐 Product access time check:', {
            currentIST: timeInfo.currentTimeString,
            allowedHours: `${timeInfo.startTime} - ${timeInfo.endTime}`,
            isAllowed: timeInfo.isAllowed,
            userId: userId,
            role: userRole
        });
        
        if (!isAllowed) {
            return res.status(200).json({
                success: false,
                message: `Products are only available during these hours: ${timeInfo.formattedSlots} IST. Current time: ${timeInfo.currentTimeString} IST`,
                products: [],
                timeInfo: {
                    currentTime: timeInfo.currentTimeString,
                    allowedHours: timeInfo.formattedSlots,
                    timeSlots: timeInfo.timeSlots,
                    timezone: 'IST (UTC+05:30)'
                }
            });
        }
        
        const query = "SELECT product_id, product_image_url, paper_type, size, gsm, price_per_slot, selling_price, selling_price_2, selling_price_3, available_stock FROM product WHERE stock_status != 'out_of_stock' ORDER BY product_id ASC";
        const { rows } = await db.query(query);
        
        res.status(200).json({
            success: true,
            products: rows,
            timeInfo: {
                currentTime: timeInfo.currentTimeString,
                allowedHours: timeInfo.formattedSlots,
                timeSlots: timeInfo.timeSlots,
                timezone: 'IST (UTC+05:30)'
            }
        });
    } catch (error) {
        console.error('❌ Error fetching available products:', error);
        res.status(500).json({ message: 'Failed to fetch available products.' });
    }
};

/**
 * UPDATE: Edit details of an existing product.
 */
exports.updateProduct = async (req, res) => {
    const { productId } = req.params;
    const { price_per_slot, available_stock, selling_price, selling_price_2, selling_price_3 } = req.body;

    if (price_per_slot === undefined || available_stock === undefined || selling_price === undefined) {
        return res.status(400).json({ message: 'Price, selling price, and available stock are required for an update.' });
    }

    try {
        const stock_status = calculateStockStatus(available_stock);
        const query = `
            UPDATE product SET price_per_slot = $1, selling_price = $2, selling_price_2 = $3, selling_price_3 = $4, stock_status = $5, available_stock = $6, last_updated = NOW()
            WHERE product_id = $7 RETURNING *;
        `;
        const { rows } = await db.query(query, [price_per_slot, selling_price, selling_price_2 || selling_price, selling_price_3 || selling_price, stock_status, available_stock, productId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error(`❌ Error updating product ${productId}:`, error);
        res.status(500).json({ message: 'Failed to update product.' });
    }
};

/**
 * READ STATS: Get product-related stats for the admin dashboard.
 */
exports.getProductStats = async (req, res) => {
    try {
        const query = "SELECT COUNT(*) FROM product WHERE stock_status IN ('available', 'low')";
        const { rows } = await db.query(query);

        res.status(200).json({ 
            availableProducts: parseInt(rows[0].count, 10),
        });
    } catch (error) {
        console.error('❌ Error fetching product stats:', error);
        res.status(500).json({ message: 'Failed to fetch product stats.' });
    }
};

/**
 * READ STATS: Fetches just the count of product types that have available stock.
 * Respects vendor visibility settings.
 */

exports.getAvailableProductCount = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const userRole = req.user.role;
        
        // Check vendor visibility (only for vendors, not for admins/coordinators)
        if (userRole === 'vendor') {
            const visibilityCheck = await db.query(
                'SELECT product_visibility FROM vendors WHERE id = $1', 
                [userId]
            );
            
            if (visibilityCheck.rows.length > 0 && !visibilityCheck.rows[0].product_visibility) {
                // Return 0 count when visibility is disabled - appears as no stock
                return res.status(200).json({ 
                    availableProducts: 0,
                    message: 'No products currently in stock.'
                });
            }
        }
        
        // Check if products should be displayed based on IST time
        const isAllowed = shouldDisplayProducts();
        const timeInfo = getISTTimeInfo();
        
        console.log('🕐 Product count time check:', {
            currentIST: timeInfo.currentTimeString,
            allowedHours: `${timeInfo.startTime} - ${timeInfo.endTime}`,
            isAllowed: timeInfo.isAllowed,
            userId: userId,
            role: userRole
        });
        
        if (!isAllowed) {
            // Return 0 count when outside business hours
            return res.status(200).json({ 
                availableProducts: 0,
                timeInfo: {
                    currentTime: timeInfo.currentTimeString,
                    allowedHours: `${timeInfo.startTime} - ${timeInfo.endTime}`,
                    timezone: 'IST (UTC+05:30)',
                    message: 'Products not available due to time constraints'
                }
            });
        }
        
        const query = "SELECT COUNT(*) FROM product WHERE stock_status != 'out_of_stock'";
        const result = await db.query(query);
        const count = parseInt(result.rows[0].count, 10);
        res.status(200).json({ 
            availableProducts: count,
            timeInfo: {
                currentTime: timeInfo.currentTimeString,
                allowedHours: `${timeInfo.startTime} - ${timeInfo.endTime}`,
                timezone: 'IST (UTC+05:30)'
            }
        });
    } catch (error) {
        console.error('❌ Error fetching available product count:', error);
        res.status(500).json({ message: 'Failed to fetch product count.' });
    }
};
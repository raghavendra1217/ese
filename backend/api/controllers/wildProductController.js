const db = require('../config/database');
const path = require('path');
const { uploadFileToR2, deleteFileFromR2 } = require('../utils/cloudflareR2');
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
 * Calculates the next sequential ID for a wild product (e.g., WP_001, WP_002).
 * MUST be called within a transaction that has locked the 'wild_products' table.
 */
const getNextWildProductId = async (client) => {
    const query = "SELECT wild_product_id FROM wild_products ORDER BY wild_product_id DESC LIMIT 1";
    const { rows } = await client.query(query);

    if (rows.length === 0) {
        return 'WP_001';
    }
    const lastNumber = parseInt(rows[0].wild_product_id.split('_')[1], 10);
    return `WP_${String(lastNumber + 1).padStart(3, '0')}`;
};

/**
 * CREATE: Add a new wild product and upload its image to Cloudflare R2.
 */
exports.addWildProduct = async (req, res) => {
    const { product_name, base_price, selling_price, selling_price_2, selling_price_3, gst_percentage = 18.00, available_stock } = req.body;
    const productImageFile = req.file;

    if (!product_name || !base_price || !selling_price || !available_stock || !productImageFile) {
        return res.status(400).json({ message: 'Product Name, Base Price, Selling Price, Stock, and an Image are required.' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('LOCK TABLE wild_products IN EXCLUSIVE MODE');

        const wild_product_id = await getNextWildProductId(client);
        const newFilename = `${wild_product_id}${path.extname(productImageFile.originalname)}`;

        // Upload the file to R2 and get the full public URL.
        const product_image_url = await uploadFileToR2(productImageFile, 'wild_products', newFilename);
        console.log('🔍 Wild product image URL:', product_image_url);

        const stock_status = calculateStockStatus(available_stock);
        
        const query = `
            INSERT INTO wild_products (wild_product_id, product_name, product_image_url, base_price, selling_price, selling_price_2, selling_price_3, gst_percentage, available_stock, stock_status, selling_date_count, last_updated)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 30, NOW()) RETURNING *;
        `;
        const params = [wild_product_id, product_name, product_image_url, base_price, selling_price, selling_price_2 || selling_price, selling_price_3 || selling_price, gst_percentage, available_stock, stock_status];
        const { rows } = await client.query(query, params);
        
        await client.query('COMMIT');
        res.status(201).json(rows[0]);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error adding wild product:', error);
        res.status(500).json({ message: 'Failed to add wild product.' });
    } finally {
        client.release();
    }
};

/**
 * DELETE: Remove a wild product from the database and its image from Cloudflare R2.
 */
exports.deleteWildProduct = async (req, res) => {
    const { wildProductId } = req.params;
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Check if the wild product has associated sales records.
        const tradeCheck = await client.query('SELECT 1 FROM wild_product_trading WHERE wild_product_id = $1 LIMIT 1', [wildProductId]);
        if (tradeCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: 'Cannot delete wild product because it has associated sales records. Consider setting its stock to zero instead.' });
        }

        // Get the wild product's image URL before deleting the DB record.
        const productRes = await client.query('SELECT product_image_url FROM wild_products WHERE wild_product_id = $1', [wildProductId]);
        const productToDelete = productRes.rows[0];

        // Delete the wild product from the database.
        const deleteResult = await client.query('DELETE FROM wild_products WHERE wild_product_id = $1', [wildProductId]);

        if (deleteResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Wild product not found.' });
        }

        // If an image URL exists, delete the corresponding file from R2.
        if (productToDelete && productToDelete.product_image_url) {
            await deleteFileFromR2(productToDelete.product_image_url);
        }
        
        await client.query('COMMIT');
        res.status(200).json({ message: 'Wild product deleted successfully.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Error deleting wild product ${wildProductId}:`, error);
        res.status(500).json({ message: 'Failed to delete wild product.' });
    } finally {
        client.release();
    }
};

/**
 * READ: Get a list of all wild products for the admin panel.
 */
exports.getAllWildProducts = async (req, res) => {
    try {
        console.log('🔍 Attempting to fetch wild products...');
        
        // Simple query first to test basic functionality
        const query = `SELECT * FROM wild_products ORDER BY wild_product_id ASC`;
        
        console.log('🔍 Executing query:', query);
        const { rows } = await db.query(query);
        console.log('🔍 Wild products fetched:', rows.length, 'products');
        
        // Calculate final_price and profit for each row
        const processedRows = rows.map(row => ({
            ...row,
            final_price: Math.round((row.base_price * (1 + row.gst_percentage / 100)) * 100) / 100,
            profit: Math.round((row.selling_price - (row.base_price * (1 + row.gst_percentage / 100))) * 100) / 100
        }));
        
        res.status(200).json(processedRows);
    } catch (error) {
        console.error('❌ Error fetching wild products:', error);
        console.error('❌ Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            hint: error.hint
        });
        res.status(500).json({ 
            message: 'Failed to fetch wild products.',
            error: error.message 
        });
    }
};

/**
 * READ: Get all wild products with available stock for vendors to purchase.
 * Wild products are only available during configured business hours (IST).
 */
exports.getAvailableWildProducts = async (req, res) => {
    try {
        console.log('🔍 Attempting to fetch available wild products...');
        
        // Check if products should be displayed based on IST time
        const isAllowed = shouldDisplayProducts();
        const timeInfo = getISTTimeInfo();
        
        console.log('🕐 Wild product access time check:', {
            currentIST: timeInfo.currentTimeString,
            allowedHours: timeInfo.formattedSlots,
            isAllowed: timeInfo.isAllowed
        });
        
        if (!isAllowed) {
            return res.status(200).json({
                success: false,
                message: `Wild products are only available during these hours: ${timeInfo.formattedSlots} IST. Current time: ${timeInfo.currentTimeString} IST`,
                products: [],
                timeInfo: {
                    currentTime: timeInfo.currentTimeString,
                    allowedHours: timeInfo.formattedSlots,
                    timeSlots: timeInfo.timeSlots,
                    timezone: 'IST (UTC+05:30)'
                }
            });
        }
        
        const query = `
            SELECT wild_product_id, product_image_url, product_name, base_price, selling_price, selling_price_2, selling_price_3, gst_percentage, 
                   available_stock, stock_status, selling_date_count
            FROM wild_products 
            WHERE stock_status != 'out_of_stock' 
            ORDER BY wild_product_id ASC
        `;
        
        console.log('🔍 Executing available wild products query:', query);
        const { rows } = await db.query(query);
        console.log('🔍 Available wild products fetched:', rows.length, 'products');
        
        // Calculate final_price and profit for each row
        const processedRows = rows.map(row => ({
            ...row,
            final_price: Math.round((row.base_price * (1 + row.gst_percentage / 100)) * 100) / 100,
            profit: Math.round((row.selling_price - (row.base_price * (1 + row.gst_percentage / 100))) * 100) / 100
        }));
        
        res.status(200).json({
            success: true,
            products: processedRows,
            timeInfo: {
                currentTime: timeInfo.currentTimeString,
                allowedHours: timeInfo.formattedSlots,
                timeSlots: timeInfo.timeSlots,
                timezone: 'IST (UTC+05:30)'
            }
        });
    } catch (error) {
        console.error('❌ Error fetching available wild products:', error);
        console.error('❌ Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            hint: error.hint
        });
        res.status(500).json({ 
            message: 'Failed to fetch available wild products.',
            error: error.message 
        });
    }
};

/**
 * UPDATE: Edit details of an existing wild product.
 */
exports.updateWildProduct = async (req, res) => {
    const { wildProductId } = req.params;
    const { base_price, selling_price, selling_price_2, selling_price_3, available_stock, gst_percentage, selling_date_count } = req.body;

    if (base_price === undefined || selling_price === undefined || available_stock === undefined || gst_percentage === undefined) {
        return res.status(400).json({ message: 'Base price, Selling price, GST percentage, and available stock are required for an update.' });
    }

    try {
        const stock_status = calculateStockStatus(available_stock);
        const query = `
            UPDATE wild_products 
            SET base_price = $1, selling_price = $2, selling_price_2 = $3, selling_price_3 = $4, gst_percentage = $5, stock_status = $6, available_stock = $7, selling_date_count = $8, last_updated = NOW()
            WHERE wild_product_id = $9 RETURNING *;
        `;
        const sellingDays = selling_date_count !== undefined ? selling_date_count : 30; // Default to 30 if not provided
        const { rows } = await db.query(query, [base_price, selling_price, selling_price_2 || selling_price, selling_price_3 || selling_price, gst_percentage, stock_status, available_stock, sellingDays, wildProductId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Wild product not found.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error(`❌ Error updating wild product ${wildProductId}:`, error);
        res.status(500).json({ message: 'Failed to update wild product.' });
    }
};

/**
 * READ STATS: Get wild product-related stats for the admin dashboard.
 */
exports.getWildProductStats = async (req, res) => {
    try {
        const query = "SELECT COUNT(*) FROM wild_products WHERE stock_status IN ('available', 'low')";
        const { rows } = await db.query(query);

        res.status(200).json({ 
            availableWildProducts: parseInt(rows[0].count, 10),
        });
    } catch (error) {
        console.error('❌ Error fetching wild product stats:', error);
        res.status(500).json({ message: 'Failed to fetch wild product stats.' });
    }
};

/**
 * READ STATS: Fetches just the count of wild products that have available stock.
 */
exports.getAvailableWildProductCount = async (req, res) => {
    try {
        // Check if wild products should be displayed based on IST time
        const isAllowed = shouldDisplayProducts();
        const timeInfo = getISTTimeInfo();
        
        console.log('🕐 Wild product count time check:', {
            currentIST: timeInfo.currentTimeString,
            allowedHours: `${timeInfo.startTime} - ${timeInfo.endTime}`,
            isAllowed: timeInfo.isAllowed
        });
        
        if (!isAllowed) {
            // Return 0 count when outside business hours
            return res.status(200).json({ 
                availableWildProducts: 0,
                timeInfo: {
                    currentTime: timeInfo.currentTimeString,
                    allowedHours: `${timeInfo.startTime} - ${timeInfo.endTime}`,
                    timezone: 'IST (UTC+05:30)',
                    message: 'Wild products not available due to time constraints'
                }
            });
        }
        
        const query = "SELECT COUNT(*) FROM wild_products WHERE stock_status != 'out_of_stock'";
        const result = await db.query(query);
        const count = parseInt(result.rows[0].count, 10);
        res.status(200).json({ 
            availableWildProducts: count,
            timeInfo: {
                currentTime: timeInfo.currentTimeString,
                allowedHours: `${timeInfo.startTime} - ${timeInfo.endTime}`,
                timezone: 'IST (UTC+05:30)'
            }
        });
    } catch (error) {
        console.error('❌ Error fetching available wild product count:', error);
        res.status(500).json({ message: 'Failed to fetch wild product count.' });
    }
};

/**
 * UPDATE: Increment selling date count for all wild products (called after 30 days)
 */
exports.incrementSellingDateCount = async (req, res) => {
    try {
        const query = `
            UPDATE wild_products 
            SET selling_date_count = selling_date_count + 1, last_updated = NOW()
            WHERE stock_status != 'out_of_stock'
        `;
        const result = await db.query(query);
        
        res.status(200).json({ 
            message: 'Selling date count incremented successfully',
            updatedProducts: result.rowCount
        });
    } catch (error) {
        console.error('❌ Error incrementing selling date count:', error);
        res.status(500).json({ message: 'Failed to increment selling date count.' });
    }
};

/**
 * UPDATE: Set first sale date when a wild product is first sold
 */
exports.setFirstSaleDate = async (wildProductId, client) => {
    try {
        const query = `
            UPDATE wild_products 
            SET first_sale_date = NOW(), last_updated = NOW()
            WHERE wild_product_id = $1 AND first_sale_date IS NULL
        `;
        await client.query(query, [wildProductId]);
    } catch (error) {
        console.error(`❌ Error setting first sale date for ${wildProductId}:`, error);
    }
};

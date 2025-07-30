const db = require('../config/database');
const path = require('path');
const { uploadFileToR2, deleteFileFromR2 } = require('../utils/cloudflareR2'); // Import R2 utilities

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
    const { paper_type, size, gsm, price_per_slot, available_stock, selling_price } = req.body;
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

        const stock_status = parseInt(available_stock, 10) > 0 ? 'available' : 'out_of_stock';
        
        const query = `
            INSERT INTO product (product_id, paper_type, product_image_url, size, gsm, price_per_slot, selling_price, stock_status, available_stock, last_updated)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING *;
        `;
        const params = [product_id, paper_type, product_image_url, size, gsm, price_per_slot, selling_price, stock_status, available_stock];
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
 */
exports.getAvailableProducts = async (req, res) => {
    try {
        const query = "SELECT product_id, product_image_url, paper_type, size, gsm, price_per_slot, available_stock FROM product WHERE available_stock > 0 ORDER BY product_id ASC";
        const { rows } = await db.query(query);
        res.status(200).json(rows);
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
    const { price_per_slot, available_stock, selling_price } = req.body;

    if (price_per_slot === undefined || available_stock === undefined || selling_price === undefined) {
        return res.status(400).json({ message: 'Price, selling price, and available stock are required for an update.' });
    }

    try {
        const stock_status = parseInt(available_stock, 10) > 0 ? 'available' : 'out_of_stock';
        const query = `
            UPDATE product SET price_per_slot = $1, selling_price = $2, stock_status = $3, available_stock = $4, last_updated = NOW()
            WHERE product_id = $5 RETURNING *;
        `;
        const { rows } = await db.query(query, [price_per_slot, selling_price, stock_status, available_stock, productId]);

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
        const query = "SELECT COUNT(*) FROM product WHERE stock_status IN ('available', 'low_stock')";
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
 */
exports.getAvailableProductCount = async (req, res) => {
    try {
        const query = "SELECT COUNT(*) FROM product WHERE available_stock > 0";
        const result = await db.query(query);
        const count = parseInt(result.rows[0].count, 10);
        res.status(200).json({ availableProducts: count });
    } catch (error) {
        console.error('❌ Error fetching available product count:', error);
        res.status(500).json({ message: 'Failed to fetch product count.' });
    }
};
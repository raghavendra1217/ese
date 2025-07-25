// backend/api/controllers/productController.js

const db = require('../config/database');
const fs = require('fs');

// Helper function for sequential Product IDs (e.g., P_001)
const getNextProductId = async (client) => {
    const query = "SELECT product_id FROM product ORDER BY CAST(SUBSTRING(product_id FROM 3) AS INTEGER) DESC LIMIT 1";
    const { rows } = await client.query(query);
    if (rows.length === 0) return 'P_001';
    const lastNumber = parseInt(rows[0].product_id.split('_')[1], 10);
    return `P_${String(lastNumber + 1).padStart(3, '0')}`;
};

// CREATE: Add a new product
exports.addProduct = async (req, res) => {
    const { paper_type, size, gsm, price_per_slot, stock_status, available_stock } = req.body;
    const product_image_url = req.file ? `/products/${req.file.filename}` : null;
    const client = await db.connect();

    try {
        await client.query('BEGIN');
        const product_id = await getNextProductId(client);
        const query = `
            INSERT INTO product (product_id, paper_type, product_image_url, size, gsm, price_per_slot, stock_status, available_stock)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;
        `;
        const { rows } = await client.query(query, [product_id, paper_type, product_image_url, size, gsm, price_per_slot, stock_status, available_stock]);
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

// READ: Get all products
exports.getAllProducts = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM product ORDER BY CAST(SUBSTRING(product_id FROM 3) AS INTEGER) ASC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('❌ Error fetching products:', error);
        res.status(500).json({ message: 'Failed to fetch products.' });
    }
};

// UPDATE: Edit an existing product
exports.updateProduct = async (req, res) => {
    const { productId } = req.params;
    const { price_per_slot, stock_status, available_stock } = req.body;
    try {
        const query = `
            UPDATE product SET price_per_slot = $1, stock_status = $2, available_stock = $3
            WHERE product_id = $4 RETURNING *;
        `;
        const { rows } = await db.query(query, [price_per_slot, stock_status, available_stock, productId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('❌ Error updating product:', error);
        res.status(500).json({ message: 'Failed to update product.' });
    }
};

// DELETE: Remove a product
exports.deleteProduct = async (req, res) => {
    const { productId } = req.params;
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        // First, get the image URL to delete the file
        const { rows } = await client.query('SELECT product_image_url FROM product WHERE product_id = $1', [productId]);
        if (rows.length > 0 && rows[0].product_image_url) {
            const imagePath = `public${rows[0].product_image_url}`;
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        // Then, delete the database record
        await client.query('DELETE FROM product WHERE product_id = $1', [productId]);
        await client.query('COMMIT');
        res.status(200).json({ message: 'Product deleted successfully.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error deleting product:', error);
        res.status(500).json({ message: 'Failed to delete product.' });
    } finally {
        client.release();
    }
};

// READ STATS: Get product-related stats for the dashboard
exports.getProductStats = async (req, res) => {
    try {
        const query = "SELECT COUNT(*) FROM product WHERE stock_status IN ('available', 'low')";
        const { rows } = await db.query(query);
        res.status(200).json({ availableProducts: parseInt(rows[0].count, 10) });
    } catch (error) {
        console.error('❌ Error fetching product stats:', error);
        res.status(500).json({ message: 'Failed to fetch product stats.' });
    }
};

// in backend/api/controllers/productController.js

// ... (keep all existing functions: addProduct, getAllProducts, etc.)

// NEW FUNCTION: Get all products with available stock for vendors
exports.getAvailableProducts = async (req, res) => {
    try {
        // Only fetch products that are in stock
        const query = "SELECT * FROM product WHERE available_stock > 0 ORDER BY product_id ASC";
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('❌ Error fetching available products:', error);
        res.status(500).json({ message: 'Failed to fetch available products.' });
    }
};
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Initiates a trade by creating a pending record.
 * This function is now wrapped in a transaction and uses row-level locking
 * to prevent race conditions when checking for available stock.
 */
const initiateTrade = async (req, res) => {
    const vendorId = req.user.user_id;
    const { productId, no_of_stock_bought } = req.body;

    if (!productId || !no_of_stock_bought || parseInt(no_of_stock_bought, 10) <= 0) {
        return res.status(400).json({ message: 'Product ID and a valid quantity are required.' });
    }

    const quantity = parseInt(no_of_stock_bought, 10);
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // Select the product and lock the row for update.
        // The 'FOR UPDATE' clause prevents other transactions from modifying this row
        // until the current transaction is committed or rolled back. This solves the race condition.
        const productRes = await client.query(
            'SELECT price_per_slot, available_stock FROM product WHERE product_id = $1 FOR UPDATE',
            [productId]
        );

        if (productRes.rows.length === 0) {
            // This rollback is for safety, though no changes were made yet.
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Product not found.' });
        }

        const product = productRes.rows[0];
        if (product.available_stock < quantity) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Not enough stock available to complete this purchase.' });
        }

        const totalAmount = parseFloat(product.price_per_slot) * quantity;
        const tradeId = uuidv4();
        const tradeDate = new Date();

        const newTradeQuery = `
            INSERT INTO trading (trade_id, vendor_id, product_id, no_of_stock_bought, price_per_slot, total_amount_paid, is_approved, date)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING trade_id, total_amount_paid`;
        
        const queryParams = [tradeId, vendorId, productId, quantity, product.price_per_slot, totalAmount, false, tradeDate];
        const newTrade = await client.query(newTradeQuery, queryParams);

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Transaction initiated. Please complete payment and submit proof.',
            tradeDetails: newTrade.rows[0],
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ FATAL ERROR in initiateTrade:', error);
        res.status(500).json({ message: 'Server error during transaction initiation. Please try again.' });
    } finally {
        client.release();
    }
};

/**
 * Submits payment proof for a previously initiated trade.
 * This is now wrapped in a transaction to prevent conflicts.
 */
const submitProof = async (req, res) => {
    const { tradeId, transactionId } = req.body;
    const paymentScreenshotFile = req.file;

    if (!tradeId || !transactionId || !paymentScreenshotFile) {
        return res.status(400).json({ message: 'Trade ID, Transaction ID, and a screenshot are required.' });
    }
    
    const paymentScreenshotUrl = `/proof/${paymentScreenshotFile.filename}`;
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // Check the current state of the trade before updating
        const tradeCheckRes = await client.query('SELECT is_approved, payment_url FROM trading WHERE trade_id = $1 FOR UPDATE', [tradeId]);
        
        if (tradeCheckRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Pending trade not found.' });
        }

        const currentTrade = tradeCheckRes.rows[0];
        
        if (currentTrade.is_approved) {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: 'This trade has already been approved and cannot be modified.' });
        }
        
        if (currentTrade.payment_url) {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: 'Payment proof has already been submitted for this trade.' });
        }

        // If checks pass, update the record
        await client.query(
            `UPDATE trading SET transaction_id = $1, payment_url = $2 WHERE trade_id = $3`,
            [transactionId, paymentScreenshotUrl, tradeId]
        );

        await client.query('COMMIT');

        res.status(200).json({ message: 'Payment proof submitted successfully. Your purchase is pending approval.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error submitting payment proof:', error);
        res.status(500).json({ message: 'Server error while submitting proof. Please try again.' });
    } finally {
        client.release();
    }
};

// --- NEW FUNCTION TO GET PURCHASE HISTORY ---
/**
 * Fetches the trade history for the currently logged-in vendor.
 * Joins with the product table to get user-friendly product details.
 */
const getPurchaseHistory = async (req, res) => {
    // Get the vendor ID from the token after they have been authenticated by the 'protect' middleware
    const vendorId = req.user.user_id;

    try {
        // SQL query to get all trading records for this vendor.
        // We use a LEFT JOIN to include product details like name and image.
        const query = `
            SELECT
                t.trade_id,
                t.product_id,
                t.no_of_stock_bought,
                t.total_amount_paid,
                t.is_approved,
                t.date,
                t.transaction_id,
                p.paper_type,
                p.product_image_url
            FROM
                trading AS t
            LEFT JOIN
                product AS p ON t.product_id = p.product_id
            WHERE
                t.vendor_id = $1
            ORDER BY
                t.date DESC;
        `;
        
        const historyResult = await db.query(query, [vendorId]);

        res.status(200).json(historyResult.rows);

    } catch (error) {
        console.error('❌ Error fetching purchase history:', error);
        res.status(500).json({ message: 'Server error while fetching your purchase history.' });
    }
};


// --- UPDATED EXPORTS ---
module.exports = {
    initiateTrade,
    submitProof,
    getPurchaseHistory, // <-- New function is now exported
};
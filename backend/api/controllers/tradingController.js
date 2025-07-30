const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
<<<<<<< HEAD


=======
const path = require('path');
const { uploadFileToR2 } = require('../utils/cloudflareR2'); // Import R2 utility

/**
 * Queries the database to find the last sequence number for a trade proof to ensure unique names.
 * @param {object} client - The active database client.
 * @returns {Promise<number>} The next integer in the sequence.
 */
const getNextTradeProofSequence = async (client) => {
    // This regex extracts the numeric part of the filename from the full R2 URL.
    const query = `
        SELECT payment_url FROM trading
        WHERE payment_url LIKE '%/TP_%'
        ORDER BY CAST(substring(payment_url from '/TP_(\\d+)') AS INTEGER) DESC
        LIMIT 1;
    `;
    try {
        const { rows } = await client.query(query);
        if (rows.length === 0) return 1;

        const lastUrl = rows[0].payment_url;
        const match = lastUrl.match(/TP_(\d+)/);
        if (match && match[1]) {
            const lastNumber = parseInt(match[1], 10);
            return lastNumber + 1;
        }
        return 1;
    } catch {
        return 1; // Fallback on error
    }
};

/**
 * Creates a trade record after UPI payment and uploads the proof to Cloudflare R2.
 */
>>>>>>> d39126c (wallet update)
const createUpiTrade = async (req, res) => {
    const vendorId = req.user.user_id;
    const { productId, no_of_stock_bought, transactionId } = req.body;
    const paymentScreenshotFile = req.file;

    if (!productId || !no_of_stock_bought || !transactionId || !paymentScreenshotFile) {
        return res.status(400).json({ message: 'All fields, including a payment screenshot, are required.' });
    }

    const quantity = parseInt(no_of_stock_bought, 10);
<<<<<<< HEAD
    const paymentScreenshotUrl = `/trade_proofs/${paymentScreenshotFile.filename}`;
=======
>>>>>>> d39126c (wallet update)
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const productRes = await client.query('SELECT price_per_slot, available_stock FROM product WHERE product_id = $1', [productId]);
        if (productRes.rows.length === 0) throw new Error('Product not found.');
        const product = productRes.rows[0];
        if (product.available_stock < quantity) throw new Error('Not enough stock available to complete this purchase.');

<<<<<<< HEAD
=======
        // Generate a unique filename and upload the screenshot to R2.
        const nextTPNum = await getNextTradeProofSequence(client);
        const screenshotFilename = `TP_${String(nextTPNum).padStart(3, '0')}${path.extname(paymentScreenshotFile.originalname)}`;
        const paymentScreenshotUrl = await uploadFileToR2(paymentScreenshotFile, 'trade_proofs', screenshotFilename);

>>>>>>> d39126c (wallet update)
        const totalAmount = parseFloat(product.price_per_slot) * quantity;
        const tradeId = uuidv4();
        const tradeDate = new Date();

        await client.query(
            `INSERT INTO trading (trade_id, vendor_id, product_id, no_of_stock_bought, price_per_slot, total_amount_paid, is_approved, date, transaction_id, payment_url)
             VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9)`,
            [tradeId, vendorId, productId, quantity, product.price_per_slot, totalAmount, tradeDate, transactionId, paymentScreenshotUrl]
        );
        
        await client.query('COMMIT');
        res.status(201).json({ message: 'Payment proof submitted successfully. Your purchase is pending approval.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error creating UPI trade:', error);
        res.status(500).json({ message: error.message || 'Server error while creating the trade.' });
    } finally {
        client.release();
    }
};

<<<<<<< HEAD
=======

>>>>>>> d39126c (wallet update)
const executeWalletTrade = async (req, res) => {
    const vendorId = req.user.user_id;
    const { productId, no_of_stock_bought } = req.body;
    if (!productId || !no_of_stock_bought) {
        return res.status(400).json({ message: 'Product ID and quantity are required.' });
    }
    const quantity = parseInt(no_of_stock_bought, 10);
    const client = await db.connect();
    
    try {
        await client.query('BEGIN');
        
        const productRes = await client.query('SELECT price_per_slot, available_stock FROM product WHERE product_id = $1 FOR UPDATE', [productId]);
        if (productRes.rows.length === 0) throw new Error('Product not found.');
        const product = productRes.rows[0];
        if (product.available_stock < quantity) throw new Error('Not enough stock available.');

        const totalAmount = parseFloat(product.price_per_slot) * quantity;
        
        const walletRes = await client.query('SELECT digital_money FROM wallet WHERE id = $1', [vendorId]);
        if (walletRes.rows.length === 0 || parseFloat(walletRes.rows[0].digital_money) < totalAmount) {
            throw new Error('Insufficient funds in your digital wallet.');
        }

        await client.query('UPDATE wallet SET digital_money = digital_money - $1 WHERE id = $2', [totalAmount, vendorId]);
        await client.query('UPDATE product SET available_stock = available_stock - $1 WHERE product_id = $2', [quantity, productId]);
        
        const tradeId = uuidv4();
        await client.query(
            `INSERT INTO trading (trade_id, vendor_id, product_id, no_of_stock_bought, price_per_slot, total_amount_paid, is_approved, date)
             VALUES ($1, $2, $3, $4, $5, $6, 'approved', $7)`,
            [tradeId, vendorId, productId, quantity, product.price_per_slot, totalAmount, new Date()]
        );

        await client.query('COMMIT');
        res.status(200).json({ message: 'Purchase successful using your digital wallet!' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error executing wallet trade:', error);
        res.status(500).json({ message: error.message || 'Server error during wallet purchase.' });
    } finally {
        client.release();
    }
};

<<<<<<< HEAD
const submitProof = async (req, res) => {
    const { tradeId, transactionId } = req.body;
    const paymentScreenshotFile = req.file;

    if (!tradeId || !transactionId || !paymentScreenshotFile) {
        return res.status(400).json({ message: 'Trade ID, Transaction ID, and a screenshot are required.' });
    }
    
    const paymentScreenshotUrl = `/trade_proofs/${paymentScreenshotFile.filename}`;
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


const sellProduct = async (req, res) => {
    const vendorId = req.user.user_id;
    // We will sell based on the specific trade_id, not the product_id
=======
const sellProduct = async (req, res) => {
    const vendorId = req.user.user_id;
>>>>>>> d39126c (wallet update)
    const { trade_id } = req.body; 

    if (!trade_id) {
        return res.status(400).json({ message: 'Trade ID is required to sell.' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

<<<<<<< HEAD
        // Find the specific trade to sell, lock the row, and ensure it belongs to the user and is not already sold.
=======
>>>>>>> d39126c (wallet update)
        const tradeRes = await client.query(
            `SELECT t.*, p.selling_price 
             FROM trading t
             JOIN product p ON t.product_id = p.product_id
             WHERE t.trade_id = $1 AND t.vendor_id = $2 FOR UPDATE`,
            [trade_id, vendorId]
        );

        if (tradeRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Trade not found or you do not have permission to sell it.' });
        }

        const trade = tradeRes.rows[0];

        if (trade.is_sold) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'This item has already been sold.' });
        }
        
<<<<<<< HEAD
        if (!trade.is_approved) {
=======
        if (trade.is_approved !== 'approved') {
>>>>>>> d39126c (wallet update)
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'This item is not yet approved for sale.' });
        }

        const currentSellingPrice = parseFloat(trade.selling_price);
        const now = new Date();
        const boughtDate = new Date(trade.date);
<<<<<<< HEAD

        // This is your business logic for sell price
=======
        
>>>>>>> d39126c (wallet update)
        const daysSinceBought = (now - boughtDate) / (1000 * 60 * 60 * 24);
        const sellPrice = daysSinceBought < 8 ? parseFloat(trade.price_per_slot) : currentSellingPrice;
        
        const totalMoneyFromSale = trade.no_of_stock_bought * sellPrice;

<<<<<<< HEAD
        // Mark this specific trade as sold
=======
>>>>>>> d39126c (wallet update)
        await client.query(
            `UPDATE trading SET is_sold = TRUE, sold_at = $1 WHERE trade_id = $2`,
            [sellPrice, trade.trade_id]
        );

<<<<<<< HEAD
        // --- Wallet Update Logic (same as before, but cleaner) ---
=======
>>>>>>> d39126c (wallet update)
        let walletRes = await client.query('SELECT wallet_id FROM wallet WHERE id = $1 AND role = $2', [vendorId, 'vendor']);
        let walletId;
        
        if (walletRes.rows.length === 0) {
<<<<<<< HEAD
             // Create wallet if it doesn't exist
            const idRes = await client.query(`SELECT wallet_id FROM wallet ORDER BY wallet_id DESC LIMIT 1`);
=======
            const idRes = await client.query(`SELECT wallet_id FROM wallet ORDER BY CAST(SUBSTRING(wallet_id FROM 3) AS INTEGER) DESC LIMIT 1`);
>>>>>>> d39126c (wallet update)
            let nextNum = 1;
            if (idRes.rows.length > 0) {
                const lastIdNum = parseInt(idRes.rows[0].wallet_id.split('_')[1], 10);
                if (!isNaN(lastIdNum)) nextNum = lastIdNum + 1;
            }
            walletId = `w_${String(nextNum).padStart(3, '0')}`;
            await client.query(
                'INSERT INTO wallet (wallet_id, id, role, digital_money) VALUES ($1, $2, $3, $4)', 
                [walletId, vendorId, 'vendor', totalMoneyFromSale]
            );
        } else {
<<<<<<< HEAD
            // Add money to existing wallet
=======
>>>>>>> d39126c (wallet update)
            walletId = walletRes.rows[0].wallet_id;
            await client.query(
                'UPDATE wallet SET digital_money = digital_money + $1 WHERE wallet_id = $2', 
                [totalMoneyFromSale, walletId]
            );
        }

<<<<<<< HEAD
        // Get the final updated balance to return to the frontend
=======
>>>>>>> d39126c (wallet update)
        const updatedWallet = await client.query('SELECT digital_money FROM wallet WHERE wallet_id = $1', [walletId]);

        await client.query('COMMIT');
        
        res.status(200).json({
            message: 'Item sold successfully!',
            digital_money: updatedWallet.rows[0].digital_money,
<<<<<<< HEAD
            sold_trade_id: trade_id // Send back the ID of what was sold
=======
            sold_trade_id: trade_id
>>>>>>> d39126c (wallet update)
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error selling product:', error);
        res.status(500).json({ message: 'Server error while trying to sell the item.' });
    } finally {
        client.release();
    }
};

<<<<<<< HEAD


=======
>>>>>>> d39126c (wallet update)
const getActiveTrades = async (req, res) => {
    const vendorId = req.user.user_id;
    try {
        const query = `
            SELECT
<<<<<<< HEAD
                t.trade_id,
                t.product_id,
                t.no_of_stock_bought,
                t.price_per_slot AS purchase_price, -- Price from the trade record
                t.is_approved,
                t.is_sold,
                t.date AS purchase_date,
                p.paper_type,
                p.product_image_url,
                p.selling_price AS current_selling_price -- Current market price
            FROM
                trading AS t
            LEFT JOIN
                product AS p ON t.product_id = p.product_id
            WHERE
                t.vendor_id = $1
                AND t.is_approved = 'approved'
                AND (t.is_sold IS NULL OR t.is_sold = FALSE)
            ORDER BY
                t.date DESC;
=======
                t.trade_id, t.product_id, t.no_of_stock_bought,
                t.price_per_slot AS purchase_price, t.is_approved, t.is_sold, t.date AS purchase_date,
                p.paper_type, p.product_image_url, p.selling_price AS current_selling_price
            FROM trading AS t
            LEFT JOIN product AS p ON t.product_id = p.product_id
            WHERE t.vendor_id = $1 AND t.is_approved = 'approved' AND (t.is_sold IS NULL OR t.is_sold = FALSE)
            ORDER BY t.date DESC;
>>>>>>> d39126c (wallet update)
        `;
        const result = await db.query(query, [vendorId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching active trades:', error);
        res.status(500).json({ message: 'Server error while fetching active trades.' });
    }
};

<<<<<<< HEAD
/**
 * Fetches SOLD trades for the logged-in vendor.
 */
=======
>>>>>>> d39126c (wallet update)
const getSoldTrades = async (req, res) => {
    const vendorId = req.user.user_id;
    try {
        const query = `
            SELECT
<<<<<<< HEAD
                t.trade_id,
                t.product_id,
                t.no_of_stock_bought,
                t.price_per_slot AS purchase_price, -- Original purchase price
                t.sold_at AS sale_price, -- The price it was sold for
                t.date AS purchase_date,
                p.paper_type,
                p.product_image_url
            FROM
                trading AS t
            LEFT JOIN
                product AS p ON t.product_id = p.product_id
            WHERE
                t.vendor_id = $1
                AND t.is_sold = TRUE
            ORDER BY
                t.date DESC;
=======
                t.trade_id, t.product_id, t.no_of_stock_bought,
                t.price_per_slot AS purchase_price, t.sold_at AS sale_price, t.date AS purchase_date,
                p.paper_type, p.product_image_url
            FROM trading AS t
            LEFT JOIN product AS p ON t.product_id = p.product_id
            WHERE t.vendor_id = $1 AND t.is_sold = TRUE
            ORDER BY t.date DESC;
>>>>>>> d39126c (wallet update)
        `;
        const result = await db.query(query, [vendorId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching sold trades:', error);
        res.status(500).json({ message: 'Server error while fetching trade history.' });
    }
};

<<<<<<< HEAD


=======
>>>>>>> d39126c (wallet update)
const getPurchaseHistory = async (req, res) => {
    const vendorId = req.user.user_id;
    try {
        const query = `
            SELECT
<<<<<<< HEAD
                t.trade_id,
                t.product_id,
                t.no_of_stock_bought,
                t.total_amount_paid,
                t.is_approved,
                t.date,
                t.transaction_id,
                t.comment, -- <<< ADD THIS LINE
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
=======
                t.trade_id, t.product_id, t.no_of_stock_bought, t.total_amount_paid, t.is_approved,
                t.date, t.transaction_id, t.comment,
                p.paper_type, p.product_image_url
            FROM trading AS t
            LEFT JOIN product AS p ON t.product_id = p.product_id
            WHERE t.vendor_id = $1
            ORDER BY t.date DESC;
>>>>>>> d39126c (wallet update)
        `;
        const historyResult = await db.query(query, [vendorId]);
        res.status(200).json(historyResult.rows);
    } catch (error) {
        console.error('❌ Error fetching purchase history:', error);
        res.status(500).json({ message: 'Server error while fetching your purchase history.' });
    }
};

<<<<<<< HEAD

// Add this new function to the file
=======
>>>>>>> d39126c (wallet update)
const getRejectedTrades = async (req, res) => {
    const vendorId = req.user.user_id;
    try {
        const query = `
            SELECT
<<<<<<< HEAD
                t.trade_id,
                t.product_id,
                t.date AS purchase_date,
                t.comment, -- Select the new comment column
                p.paper_type,
                p.product_image_url
            FROM
                trading AS t
            LEFT JOIN
                product AS p ON t.product_id = p.product_id
            WHERE
                t.vendor_id = $1
                AND t.is_approved = 'rejected' -- Filter for rejected trades
            ORDER BY
                t.date DESC;
=======
                t.trade_id, t.product_id, t.date AS purchase_date, t.comment,
                p.paper_type, p.product_image_url
            FROM trading AS t
            LEFT JOIN product AS p ON t.product_id = p.product_id
            WHERE t.vendor_id = $1 AND t.is_approved = 'rejected'
            ORDER BY t.date DESC;
>>>>>>> d39126c (wallet update)
        `;
        const result = await db.query(query, [vendorId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching rejected trades:', error);
        res.status(500).json({ message: 'Server error while fetching rejected trades.' });
    }
};

// --- UPDATED EXPORTS ---
<<<<<<< HEAD
module.exports = {
    createUpiTrade,
    executeWalletTrade,
    submitProof,
    sellProduct, // Your existing sell function is fine
    getActiveTrades, // New function
    getSoldTrades,
    getRejectedTrades, // Export the new function
    getPurchaseHistory,   // New function
=======
// The `submitProof` function has been removed.
module.exports = {
    createUpiTrade,
    executeWalletTrade,
    sellProduct,
    getActiveTrades,
    getSoldTrades,
    getRejectedTrades,
    getPurchaseHistory,
>>>>>>> d39126c (wallet update)
};
// backend/api/controllers/tradingController.js

const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// --- RESOLVED: Kept your existing function ---
// This preserves the feature of saving the uploaded file to the local disk.
// In your tradingController.js

// In your tradingController.js

const createUpiTrade = async (req, res) => {
    const vendorId = req.user.user_id;
    const { productId, no_of_stock_bought, transactionId } = req.body;
    const paymentScreenshotFile = req.file;

    if (!productId || !no_of_stock_bought || !transactionId || !paymentScreenshotFile) {
        return res.status(400).json({ message: 'All fields, including a payment screenshot, are required.' });
    }

    const quantity = parseInt(no_of_stock_bought, 10);
    const paymentScreenshotUrl = `/trade_proofs/${paymentScreenshotFile.filename}`;
    const client = await db.connect();

    try {
        await client.query('BEGIN');
        const productRes = await client.query('SELECT price_per_slot, available_stock FROM product WHERE product_id = $1', [productId]);
        if (productRes.rows.length === 0) throw new Error('Product not found.');
        const product = productRes.rows[0];
        if (product.available_stock < quantity) throw new Error('Not enough stock available to complete this purchase.');
        
        const totalAmount = parseFloat(product.price_per_slot) * quantity;
        const tradeId = uuidv4();

        // --- THE FIX IS HERE ---
        // The 'date' column has been completely removed from the INSERT statement.
        // The database will now use the default NOW() value automatically.
        await client.query(
            `INSERT INTO trading (trade_id, vendor_id, product_id, no_of_stock_bought, price_per_slot, total_amount_paid, is_approved, transaction_id, payment_url)
             VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8)`,
            [tradeId, vendorId, productId, quantity, product.price_per_slot, totalAmount, transactionId, paymentScreenshotUrl]
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

// In your tradingController.js

// const executeWalletTrade = async (req, res) => {
//     const vendorId = req.user.user_id;
//     const { productId, no_of_stock_bought } = req.body;
//     if (!productId || !no_of_stock_bought) {
//         return res.status(400).json({ message: 'Product ID and quantity are required.' });
//     }
//     const quantity = parseInt(no_of_stock_bought, 10);
//     const client = await db.connect();
    
//     try {
//         await client.query('BEGIN');
//         const productRes = await client.query('SELECT price_per_slot, available_stock FROM product WHERE product_id = $1 FOR UPDATE', [productId]);
//         if (productRes.rows.length === 0) throw new Error('Product not found.');
//         const product = productRes.rows[0];
//         if (product.available_stock < quantity) throw new Error('Not enough stock available.');

//         const totalAmount = parseFloat(product.price_per_slot) * quantity;
        
//         const walletRes = await client.query('SELECT digital_money FROM wallet WHERE id = $1', [vendorId]);
//         if (walletRes.rows.length === 0 || parseFloat(walletRes.rows[0].digital_money) < totalAmount) {
//             throw new Error('Insufficient funds in your digital wallet.');
//         }

//         await client.query('UPDATE wallet SET digital_money = digital_money - $1 WHERE id = $2', [totalAmount, vendorId]);
//         await client.query('UPDATE product SET available_stock = available_stock - $1 WHERE product_id = $2', [quantity, productId]);
        
//         const tradeId = uuidv4();

//         // --- THE FIX IS HERE ---
//         // The 'date' column has been completely removed from the INSERT statement.
//         // The database will now use the default NOW() value automatically.
//         await client.query(
//             `INSERT INTO trading (trade_id, vendor_id, product_id, no_of_stock_bought, price_per_slot, total_amount_paid, is_approved)
//              VALUES ($1, $2, $3, $4, $5, $6, 'approved')`,
//             [tradeId, vendorId, productId, quantity, product.price_per_slot, totalAmount]
//         );

//         await client.query('COMMIT');
//         res.status(200).json({ message: 'Purchase successful using your digital wallet!' });

//     } catch (error) {
//         await client.query('ROLLBACK');
//         console.error('❌ Error executing wallet trade:', error);
//         res.status(500).json({ message: error.message || 'Server error during wallet purchase.' });
//     } finally {
//         client.release();
//     }
// };

const executeWalletTrade = async (req, res) => {
    const vendorId = req.user.user_id;
    const { productId, no_of_stock_bought } = req.body;

    if (!productId || !no_of_stock_bought || parseInt(no_of_stock_bought, 10) <= 0) {
        return res.status(400).json({ message: 'A valid Product ID and quantity are required.' });
    }
    const quantity = parseInt(no_of_stock_bought, 10);
    const client = await db.connect();
    
    try {
        await client.query('BEGIN');

        // Step 1: Lock and validate the product
        const productRes = await client.query('SELECT paper_type, price_per_slot, available_stock FROM product WHERE product_id = $1 FOR UPDATE', [productId]);
        if (productRes.rows.length === 0) {
            throw new Error('Product not found.');
        }
        const product = productRes.rows[0];
        if (product.available_stock < quantity) {
            throw new Error('Not enough stock available.');
        }

        const totalAmount = parseFloat(product.price_per_slot) * quantity;
        
        // Step 2: Lock and validate the user's wallet
        const walletRes = await client.query('SELECT digital_money FROM wallet WHERE id = $1 FOR UPDATE', [vendorId]);
        if (walletRes.rows.length === 0 || parseFloat(walletRes.rows[0].digital_money) < totalAmount) {
            throw new Error('Insufficient funds in your digital wallet.');
        }

        // Step 3: Perform the financial operations
        // Deduct money from wallet
        const updatedWallet = await client.query(
            'UPDATE wallet SET digital_money = digital_money - $1 WHERE id = $2 RETURNING digital_money',
            [totalAmount, vendorId]
        );
        const balanceAfterTransaction = updatedWallet.rows[0].digital_money;

        // Deduct stock from product
        await client.query(
            'UPDATE product SET available_stock = available_stock - $1 WHERE product_id = $2',
            [quantity, productId]
        );
        
        // Step 4: Create the 'trading' record
        const tradeId = uuidv4();
        await client.query(
            `INSERT INTO trading (trade_id, vendor_id, product_id, no_of_stock_bought, price_per_slot, total_amount_paid, is_approved)
             VALUES ($1, $2, $3, $4, $5, $6, 'approved')`,
            [tradeId, vendorId, productId, quantity, product.price_per_slot, totalAmount]
        );

        // --- NEW LOGIC: Create the corresponding 'transaction' record ---
        const description = `Purchase of ${quantity} units of ${product.paper_type} (Trade ID: ${tradeId})`;
        await client.query(
            `INSERT INTO transaction (user_id, transaction_type, amount, status, description, balance_after_transaction)
             VALUES ($1, 'purchase', $2, 'approved', $3, $4)`,
            [vendorId, totalAmount, description, balanceAfterTransaction]
        );
        // --- END OF NEW LOGIC ---

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


// --- RESOLVED: Kept your existing submitProof function ---
// This entire function is a feature from your local version.
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

        await client.query(`UPDATE trading SET transaction_id = $1, payment_url = $2 WHERE trade_id = $3`, [transactionId, paymentScreenshotUrl, tradeId]);
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

// --- RESOLVED: Kept your existing sellProduct function ---
// This preserves your business logic for sell price and wallet creation.

// In backend/api/controllers/tradingController.js

// const sellProduct = async (req, res) => {
//     const vendorId = req.user.user_id;
//     const { trade_id } = req.body; 

//     if (!trade_id) {
//         return res.status(400).json({ message: 'Trade ID is required to sell.' });
//     }

//     // --- NEW: Determine role based on the ID prefix ---
//     const userRole = vendorId.startsWith('v_') ? 'vendor' : 'admin';
//     // You can expand this logic later if other roles like 'admin' (a_) need wallets.
//     // if (vendorId.startsWith('a_')) userRole = 'admin';

//     const client = await db.connect();
//     try {
//         await client.query('BEGIN');
//         const tradeRes = await client.query(
//             `SELECT t.*, p.selling_price FROM trading t JOIN product p ON t.product_id = p.product_id
//              WHERE t.trade_id = $1 AND t.vendor_id = $2 FOR UPDATE`,
//             [trade_id, vendorId]
//         );

//         if (tradeRes.rows.length === 0) {
//             await client.query('ROLLBACK');
//             return res.status(404).json({ message: 'Trade not found or you do not have permission to sell it.' });
//         }
//         const trade = tradeRes.rows[0];
//         if (trade.is_sold) {
//             await client.query('ROLLBACK');
//             return res.status(400).json({ message: 'This item has already been sold.' });
//         }
//         if (trade.is_approved !== 'approved') { // Corrected check
//             await client.query('ROLLBACK');
//             return res.status(400).json({ message: 'This item is not yet approved for sale.' });
//         }

//         const currentSellingPrice = parseFloat(trade.selling_price);
//         const now = new Date();
//         const boughtDate = new Date(trade.date);
//         const daysSinceBought = (now - boughtDate) / (1000 * 60 * 60 * 24);
//         const sellPrice = daysSinceBought < 8 ? parseFloat(trade.price_per_slot) : currentSellingPrice;
//         const totalMoneyFromSale = trade.no_of_stock_bought * sellPrice;

//         await client.query(`UPDATE trading SET is_sold = TRUE, sold_at = $1 WHERE trade_id = $2`, [sellPrice, trade.trade_id]);

//         // --- UPDATED LOGIC: Removed 'role' from wallet operations ---
//         let walletRes = await client.query('SELECT 1 FROM wallet WHERE id = $1', [vendorId]);
        
//         if (walletRes.rows.length === 0) {
//             // Wallet doesn't exist, create it.
//             // Note: The 'wallet_id' logic is kept as it seems to be your intended primary key for this table.
//             const idRes = await client.query(`SELECT wallet_id FROM wallet ORDER BY CAST(SUBSTRING(wallet_id FROM 3) AS INTEGER) DESC LIMIT 1`);
//             let nextNum = 1;
//             if (idRes.rows.length > 0) {
//                 const lastIdNum = parseInt(idRes.rows[0].wallet_id.split('_')[1], 10);
//                 if (!isNaN(lastIdNum)) nextNum = lastIdNum + 1;
//             }
//             const walletId = `w_${String(nextNum).padStart(3, '0')}`;
//             // The 'role' column is removed from the INSERT statement.
//             await client.query('INSERT INTO wallet (wallet_id, id, digital_money) VALUES ($1, $2, $3)', [walletId, vendorId, totalMoneyFromSale]);
//         } else {
//             // Wallet exists, update it.
//             await client.query('UPDATE wallet SET digital_money = digital_money + $1 WHERE id = $2', [totalMoneyFromSale, vendorId]);
//         }
        
//         const updatedWallet = await client.query('SELECT digital_money FROM wallet WHERE id = $1', [vendorId]);
//         const soldItem = await client.query('SELECT * from trading WHERE trade_id = $1', [trade_id]);

//         await client.query('COMMIT');
        
//         res.status(200).json({
//             message: 'Item sold successfully!',
//             digital_money: updatedWallet.rows[0].digital_money,
//             // --- UPDATED: Return the full sold trade object as requested by frontend ---
//             sold_trade: soldItem.rows[0]
//         });

//     } catch (error) {
//         await client.query('ROLLBACK');
//         console.error('❌ Error selling product:', error);
//         res.status(500).json({ message: 'Server error while trying to sell the item.' });
//     } finally {
//         client.release();
//     }
// };



const sellProduct = async (req, res) => {
    const vendorId = req.user.user_id;
    const { trade_id } = req.body; 

    if (!trade_id) {
        return res.status(400).json({ message: 'Trade ID is required to sell.' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Step 1: Lock and validate the trade to be sold
        const tradeRes = await client.query(
            `SELECT t.*, p.paper_type, p.selling_price 
             FROM trading t 
             JOIN product p ON t.product_id = p.product_id
             WHERE t.trade_id = $1 AND t.vendor_id = $2 FOR UPDATE`,
            [trade_id, vendorId]
        );

        if (tradeRes.rows.length === 0) {
            throw new Error('Trade not found or you do not have permission to sell it.');
        }
        const trade = tradeRes.rows[0];
        if (trade.is_sold) {
            throw new Error('This item has already been sold.');
        }
        if (trade.is_approved !== 'approved') {
            throw new Error('This item is not yet approved for sale.');
        }

        // Step 2: Calculate the sale price and update the trading record
        const currentSellingPrice = parseFloat(trade.selling_price);
        const now = new Date();
        const boughtDate = new Date(trade.date);
        const daysSinceBought = (now - boughtDate) / (1000 * 60 * 60 * 24);
        const sellPrice = daysSinceBought < 8 ? parseFloat(trade.price_per_slot) : currentSellingPrice;
        const totalMoneyFromSale = trade.no_of_stock_bought * sellPrice;

        await client.query(`UPDATE trading SET is_sold = TRUE, sold_at = $1 WHERE trade_id = $2`, [sellPrice, trade.trade_id]);

        // Step 3: Find or create the user's wallet and update the balance
        let updatedWallet;
        const walletRes = await client.query('SELECT 1 FROM wallet WHERE id = $1 FOR UPDATE', [vendorId]);
        
        if (walletRes.rows.length === 0) {
            // Wallet doesn't exist, create it with the sale amount.
            const idRes = await client.query(`SELECT wallet_id FROM wallet ORDER BY CAST(SUBSTRING(wallet_id FROM 3) AS INTEGER) DESC LIMIT 1`);
            let nextNum = 1;
            if (idRes.rows.length > 0) {
                const lastIdNum = parseInt(idRes.rows[0].wallet_id.split('_')[1], 10);
                if (!isNaN(lastIdNum)) nextNum = lastIdNum + 1;
            }
            const walletId = `w_${String(nextNum).padStart(3, '0')}`;
            updatedWallet = await client.query(
                'INSERT INTO wallet (wallet_id, id, digital_money) VALUES ($1, $2, $3) RETURNING digital_money', 
                [walletId, vendorId, totalMoneyFromSale]
            );
        } else {
            // Wallet exists, add the sale amount.
            updatedWallet = await client.query(
                'UPDATE wallet SET digital_money = digital_money + $1 WHERE id = $2 RETURNING digital_money', 
                [totalMoneyFromSale, vendorId]
            );
        }
        const balanceAfterTransaction = updatedWallet.rows[0].digital_money;
        
        // Step 4: Create the corresponding 'transaction' record for the sale
        const description = `Sale of ${trade.no_of_stock_bought} units of ${trade.paper_type} (Trade ID: ${trade_id})`;
        await client.query(
            `INSERT INTO transaction (user_id, transaction_type, amount, status, description, balance_after_transaction)
             VALUES ($1, 'sale', $2, 'approved', $3, $4)`,
            [vendorId, totalMoneyFromSale, description, balanceAfterTransaction]
        );

        // Step 5: Fetch the final state of the sold item to return to the frontend
        const soldItemRes = await client.query('SELECT * from trading WHERE trade_id = $1', [trade_id]);

        await client.query('COMMIT');
        
        res.status(200).json({
            message: 'Item sold successfully!',
            digital_money: balanceAfterTransaction,
            sold_trade: soldItemRes.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error selling product:', error);
        res.status(500).json({ message: error.message || 'Server error while trying to sell the item.' });
    } finally {
        client.release();
    }
};

// These functions were not in conflict
const getActiveTrades = async (req, res) => {
    const vendorId = req.user.user_id;
    try {
        const query = `
            SELECT t.trade_id, t.product_id, t.no_of_stock_bought,
                   t.price_per_slot AS purchase_price, t.is_approved, t.is_sold,
                   t.date AS purchase_date, p.paper_type, p.product_image_url,
                   p.selling_price AS current_selling_price
            FROM trading AS t
            LEFT JOIN product AS p ON t.product_id = p.product_id
            WHERE t.vendor_id = $1 AND t.is_approved = 'approved' AND (t.is_sold IS NULL OR t.is_sold = FALSE)
            ORDER BY t.date DESC;
        `;
        const result = await db.query(query, [vendorId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching active trades:', error);
        res.status(500).json({ message: 'Server error while fetching active trades.' });
    }
};

const getSoldTrades = async (req, res) => {
    const vendorId = req.user.user_id;
    try {
        const query = `
            SELECT t.trade_id, t.product_id, t.no_of_stock_bought,
                   t.price_per_slot AS purchase_price, t.sold_at AS sale_price,
                   t.date AS purchase_date, p.paper_type, p.product_image_url
            FROM trading AS t
            LEFT JOIN product AS p ON t.product_id = p.product_id
            WHERE t.vendor_id = $1 AND t.is_sold = TRUE
            ORDER BY t.date DESC;
        `;
        const result = await db.query(query, [vendorId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching sold trades:', error);
        res.status(500).json({ message: 'Server error while fetching trade history.' });
    }
};

const getPurchaseHistory = async (req, res) => {
    const vendorId = req.user.user_id;
    try {
        const query = `
            SELECT t.trade_id, t.product_id, t.no_of_stock_bought,
                   t.total_amount_paid, t.is_approved, t.date, t.transaction_id, t.comment,
                   p.paper_type, p.product_image_url
            FROM trading AS t
            LEFT JOIN product AS p ON t.product_id = p.product_id
            WHERE t.vendor_id = $1
            ORDER BY t.date DESC;
        `;
        const historyResult = await db.query(query, [vendorId]);
        res.status(200).json(historyResult.rows);
    } catch (error) {
        console.error('❌ Error fetching purchase history:', error);
        res.status(500).json({ message: 'Server error while fetching your purchase history.' });
    }
};

const getRejectedTrades = async (req, res) => {
    const vendorId = req.user.user_id;
    try {
        const query = `
            SELECT t.trade_id, t.product_id, t.date AS purchase_date, t.comment,
                   p.paper_type, p.product_image_url
            FROM trading AS t
            LEFT JOIN product AS p ON t.product_id = p.product_id
            WHERE t.vendor_id = $1 AND t.is_approved = 'rejected'
            ORDER BY t.date DESC;
        `;
        const result = await db.query(query, [vendorId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching rejected trades:', error);
        res.status(500).json({ message: 'Server error while fetching rejected trades.' });
    }
};


// --- RESOLVED: Kept your existing exports, including submitProof ---
module.exports = {
    createUpiTrade,
    executeWalletTrade,
    submitProof,
    sellProduct,
    getActiveTrades,
    getSoldTrades,
    getRejectedTrades,
    getPurchaseHistory,
};
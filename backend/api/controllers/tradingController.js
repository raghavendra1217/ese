// backend/api/controllers/tradingController.js

const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// This function runs when the user clicks "Proceed to Payment" in the modal.
// Its only job is to calculate the amount and create a PENDING record.
const initiateTrade = async (req, res) => {
    const vendorId = req.user.user_id; 
    const { productId, no_of_stock_bought } = req.body;

    if (!productId || !no_of_stock_bought || no_of_stock_bought <= 0) {
        return res.status(400).json({ message: 'Product ID and a valid quantity are required.' });
    }
    
    const quantity = parseInt(no_of_stock_bought, 10);

    try {
        const productResult = await pool.query('SELECT price_per_slot, available_stock FROM product WHERE product_id = $1', [productId]);
        if (productResult.rows.length === 0) return res.status(404).json({ message: 'Product not found.' });

        const product = productResult.rows[0];
        const pricePerSlot = parseFloat(product.price_per_slot);
        if (product.available_stock < quantity) return res.status(400).json({ message: 'Not enough stock available.' });
        
        const totalAmount = pricePerSlot * quantity;
        const tradeId = uuidv4();
        const tradeDate = new Date();

        const newTradeQuery = `
            INSERT INTO trading (trade_id, vendor_id, product_id, no_of_stock_bought, price_per_slot, total_amount_paid, is_approved, date)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING trade_id, total_amount_paid`;
        
        const queryParams = [tradeId, vendorId, productId, quantity, pricePerSlot, totalAmount, false, tradeDate];
        const newTrade = await pool.query(newTradeQuery, queryParams);
        
        // It sends back the details needed for the payment form.
        res.status(201).json({
            message: 'Transaction initiated. Please complete payment and submit proof.',
            tradeDetails: newTrade.rows[0],
        });

    } catch (error) {
        console.error('FATAL ERROR in initiateTrade:', error);
        res.status(500).json({ message: 'Server error during transaction initiation.' });
    }
};

// This function runs when the user clicks the final "Submit Proof" button.
const submitProof = async (req, res) => {
    const { tradeId, transactionId } = req.body;
    const paymentScreenshotUrl = req.file ? `/proof/${req.file.filename}` : null;

    if (!tradeId || !transactionId || !paymentScreenshotUrl) {
        return res.status(400).json({ message: 'Trade ID, Transaction ID, and a screenshot are required.' });
    }

    try {
        const result = await pool.query(
            `UPDATE trading SET transaction_id = $1, payment_url = $2 WHERE trade_id = $3 RETURNING trade_id`,
            [transactionId, paymentScreenshotUrl, tradeId]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: 'Pending trade not found.' });

        res.status(200).json({ message: 'Payment proof submitted successfully. Your purchase is pending approval.' });

    } catch (error) {
        console.error('Error submitting payment proof:', error);
        res.status(500).json({ message: 'Server error while submitting proof.' });
    }
};

module.exports = {
    initiateTrade,
    submitProof,
};
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { checkAndCancelWithdrawals, generateCancellationMessage } = require('../utils/withdrawalChecker');

/**
 * CREATE: Purchase wild product using wallet balance
 */
exports.purchaseWildProduct = async (req, res) => {
    const vendorId = req.user.user_id;
    const { wildProductId, quantity } = req.body;

    if (!wildProductId || !quantity) {
        return res.status(400).json({ message: 'Wild Product ID and quantity are required.' });
    }

    const quantityNum = parseInt(quantity, 10);
    if (quantityNum <= 0) {
        return res.status(400).json({ message: 'Quantity must be a positive number.' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Get wild product details
        const productRes = await client.query('SELECT * FROM wild_products WHERE wild_product_id = $1', [wildProductId]);
        if (productRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Wild product not found.' });
        }

        const product = productRes.rows[0];
        
        // Check stock availability
        if (product.available_stock < quantityNum) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Insufficient stock available.' });
        }

        // Calculate prices
        const basePrice = parseFloat(product.base_price);
        const gstPercentage = parseFloat(product.gst_percentage);
        const finalPrice = Math.round((basePrice * (1 + gstPercentage / 100)) * 100) / 100; // Round to 2 decimal places
        const gstAmount = Math.round((basePrice * quantityNum * gstPercentage / 100) * 100) / 100; // Round to 2 decimal places
        const totalAmount = Math.round((finalPrice * quantityNum) * 100) / 100; // Round to 2 decimal places
        
        console.log('🔍 Wild Product Purchase Calculation:', {
            wildProductId,
            basePrice,
            gstPercentage,
            finalPrice,
            quantityNum,
            totalAmount
        });

        // Check wallet balance
        const walletRes = await client.query('SELECT digital_money FROM wallet WHERE id = $1 FOR UPDATE', [vendorId]);
        if (walletRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Wallet not found.' });
        }

        const currentBalance = parseFloat(walletRes.rows[0].digital_money);
        if (currentBalance < totalAmount) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Insufficient wallet balance.' });
        }

        // Deduct amount from wallet
        const newBalance = currentBalance - totalAmount;
        await client.query('UPDATE wallet SET digital_money = $1 WHERE id = $2', [newBalance, vendorId]);
        
        // Check and cancel withdrawals if insufficient balance
        const { cancelledWithdrawals } = await checkAndCancelWithdrawals(client, vendorId, newBalance);

        // Update wild product stock
        const newStock = product.available_stock - quantityNum;
        const newStockStatus = newStock === 0 ? 'out_of_stock' : (newStock <= 80 ? 'low' : 'available');
        await client.query('UPDATE wild_products SET available_stock = $1, stock_status = $2, last_updated = NOW() WHERE wild_product_id = $3', 
            [newStock, newStockStatus, wildProductId]);

        // Set first sale date if this is the first sale
        if (product.first_sale_date === null) {
            await client.query('UPDATE wild_products SET first_sale_date = NOW(), last_updated = NOW() WHERE wild_product_id = $1 AND first_sale_date IS NULL', 
                [wildProductId]);
        }

        // Create trading record in the existing trading table
        const tradeId = uuidv4();
        const insertQuery = `
            INSERT INTO trading (
                trade_id, vendor_id, product_id, no_of_stock_bought, price_per_slot, 
                total_amount_paid, is_approved, referred_id, percentage, is_claimed
            )
            VALUES ($1, $2, $3, $4, $5, $6, 'approved', $7, $8, FALSE)
        `;
        await client.query(insertQuery, [
            tradeId, vendorId, wildProductId, quantityNum, finalPrice,
            totalAmount, null, null
        ]);

        // Create transaction record
        const description = `Purchase of ${quantityNum} units of ${product.product_name} (Wild Product Trade ID: ${tradeId})`;
        await client.query(
            `INSERT INTO transaction (user_id, transaction_type, amount, status, description, balance_after_transaction)
             VALUES ($1, 'wild_product_purchase', $2, 'approved', $3, $4)`,
            [vendorId, totalAmount, description, newBalance]
        );

        await client.query('COMMIT');
        
        // Generate response message with withdrawal cancellation info
        let message = 'Wild product purchase successful!';
        const cancellationMessage = generateCancellationMessage(cancelledWithdrawals);
        if (cancellationMessage) {
            message += ` ${cancellationMessage}`;
        }
        
        res.status(200).json({ 
            message,
            tradeId: tradeId,
            totalAmount: totalAmount,
            newBalance: newBalance,
            cancelledWithdrawals: cancelledWithdrawals.length > 0 ? cancelledWithdrawals : undefined
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error purchasing wild product:', error);
        res.status(500).json({ message: 'Failed to purchase wild product.' });
    } finally {
        client.release();
    }
};

/**
 * READ: Get wild product trading history for a vendor
 */
exports.getWildProductTradingHistory = async (req, res) => {
    const vendorId = req.user.user_id;
    
    try {
        const query = `
            SELECT 
                t.trade_id,
                t.no_of_stock_bought as quantity,
                t.price_per_slot as final_price,
                t.total_amount_paid as total_amount,
                t.is_approved,
                t.is_sold,
                t.date as purchase_date,
                t.sold_at as sale_price,
                t.sold_on as sale_date,
                wp.product_name,
                wp.product_image_url,
                wp.selling_date_count
            FROM trading t
            JOIN wild_products wp ON t.product_id = wp.wild_product_id
            WHERE t.vendor_id = $1 AND t.product_id LIKE 'WP_%'
            ORDER BY t.date DESC
        `;
        const { rows } = await db.query(query, [vendorId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('❌ Error fetching wild product trading history:', error);
        res.status(500).json({ message: 'Failed to fetch trading history.' });
    }
};

/**
 * READ: Get all wild product trades for admin
 */
exports.getAllWildProductTrades = async (req, res) => {
    try {
        const query = `
            SELECT 
                t.trade_id,
                t.vendor_id,
                v.vendor_name,
                t.product_id as wild_product_id,
                wp.product_name,
                t.no_of_stock_bought as quantity,
                t.price_per_slot as final_price,
                t.total_amount_paid as total_amount,
                t.is_approved,
                t.created_at
            FROM trading t
            JOIN vendors v ON t.vendor_id = v.id
            JOIN wild_products wp ON t.product_id = wp.wild_product_id
            WHERE t.product_id LIKE 'WP_%'
            ORDER BY t.created_at DESC
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('❌ Error fetching all wild product trades:', error);
        res.status(500).json({ message: 'Failed to fetch wild product trades.' });
    }
};

/**
 * READ: Get wild product trading stats for admin dashboard
 */
exports.getWildProductTradingStats = async (req, res) => {
    try {
        const query = `
            SELECT 
                COUNT(*) as total_trades,
                SUM(total_amount_paid) as total_revenue,
                COUNT(DISTINCT vendor_id) as unique_vendors
            FROM trading
            WHERE is_approved = 'approved' AND product_id LIKE 'WP_%'
        `;
        const { rows } = await db.query(query);
        
        res.status(200).json({
            totalTrades: parseInt(rows[0].total_trades, 10),
            totalRevenue: parseFloat(rows[0].total_revenue || 0),
            uniqueVendors: parseInt(rows[0].unique_vendors, 10)
        });
    } catch (error) {
        console.error('❌ Error fetching wild product trading stats:', error);
        res.status(500).json({ message: 'Failed to fetch trading stats.' });
    }
};

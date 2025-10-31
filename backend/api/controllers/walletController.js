// backend/api/controllers/walletController.js

const db = require('../config/database');
const { formatTimestampsForDisplay } = require('../utils/timeUtils');
const path = require('path');
const { uploadFileToR2 } = require('../utils/cloudflareR2'); // Keep for new functions
const { runPy } = require('../utils/emailRunner');
const { getWithdrawalWindow } = require('../utils/withdrawalWindow');
const { autoSendTransactionToAPI } = require('./integrationController');

exports.getWallet = async (req, res) => {
    const userId = req.user.user_id;
    // --- UPDATED: 'role' is now determined dynamically, not from the DB ---
    const role = userId.startsWith('v_') ? 'vendor' : 'admin'; // Or another default

    if (!userId) {
        return res.status(401).json({ message: 'Not authorized' });
    }

    const client = await db.connect(); // Use a client for potential transactions
    try {
        // The query no longer checks for 'role'
        let walletRes = await client.query('SELECT * FROM wallet WHERE id = $1', [userId]);
        let walletId;

        // Check for pending withdrawals (this logic is unchanged)
        const pendingResult = await client.query(
            `SELECT 1 FROM transaction WHERE user_id = $1 AND transaction_type = 'withdrawal' AND status = 'pending' LIMIT 1;`,
            [userId]
        );
        const hasPendingWithdrawal = pendingResult.rows.length > 0;

        if (walletRes.rows.length === 0) {
            // Logic for creating a new wallet
            const idRes = await client.query(`SELECT wallet_id FROM wallet ORDER BY CAST(SUBSTRING(wallet_id FROM 3) AS INTEGER) DESC LIMIT 1`);
            let nextNum = 1;
            if (idRes.rows.length > 0 && idRes.rows[0].wallet_id) {
                const lastIdNum = parseInt(idRes.rows[0].wallet_id.split('_')[1], 10);
                if (!isNaN(lastIdNum)) nextNum = lastIdNum + 1;
            }
            walletId = `w_${String(nextNum).padStart(3, '0')}`;
            
            // --- UPDATED: 'role' column is removed from the INSERT statement ---
            await client.query('INSERT INTO wallet (wallet_id, id, digital_money) VALUES ($1, $2, $3)', [walletId, userId, 0]);
            
            res.json({
                wallet_id: walletId,
                id: userId,
                role, // Send the dynamically determined role
                digital_money: 0,
                hasPendingWithdrawal: false
            });
        } else {
            const wallet = walletRes.rows[0];
            res.json({
                wallet_id: wallet.wallet_id,
                id: wallet.id,
                role, // Send the dynamically determined role
                digital_money: parseFloat(wallet.digital_money), // Ensure it's a number
                hasPendingWithdrawal: hasPendingWithdrawal
            });
        }
    } catch (error) {
        console.error('❌ Error fetching/creating wallet:', error);
        res.status(500).json({ message: 'Failed to fetch or create wallet.' });
    } finally {
        if (client) client.release(); // Ensure client is released
    }
};

// --- UPDATED: Integrated with Easebuzz Payment Gateway ---
exports.requestDeposit = async (req, res) => {
    console.log('🔍 requestDeposit called with:', {
        body: req.body,
        user: req.user
    });
    
    const userId = req.user.user_id;
    const { amount } = req.body;
    
    console.log('🔍 Parsed data:', { userId, amount });
    
    if (!amount) {
        console.log('❌ Validation failed: missing amount');
        return res.status(400).json({ message: 'Amount is required.' });
    }
    
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
        console.log('❌ Validation failed: invalid amount');
        return res.status(400).json({ message: 'A valid, positive amount is required.' });
    }
    
    // Minimum amount validation (from environment variable)
    const minDepositAmount = parseFloat(process.env.MIN_DEPOSIT_AMOUNT) || 100;
    if (depositAmount < minDepositAmount) {
        console.log('❌ Validation failed: amount too low');
        return res.status(400).json({ 
            message: `Minimum deposit amount is ₹${minDepositAmount}.` 
        });
    }
    
    try {
        // Get user details for payment gateway
        const userQuery = await db.query(
            'SELECT email FROM login WHERE user_id = $1',
            [userId]
        );
        
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        const user = userQuery.rows[0];
        
        // Get user name and phone number from vendors table
        let userName = 'User';
        let userPhone = '9999999999'; // Default phone
        
        try {
            const vendorQuery = await db.query(
                'SELECT vendor_name, phone_number FROM vendors WHERE id = $1',
                [userId]
            );
            if (vendorQuery.rows.length > 0) {
                userName = vendorQuery.rows[0].vendor_name || 'User';
                userPhone = vendorQuery.rows[0].phone_number || '9999999999';
            }
        } catch (e) {
            console.log('Could not fetch vendor details, using defaults');
        }
        
        // Call Easebuzz payment initiation
        const easebuzzController = require('./easebuzzController');
        
        // Create a mock request object for the Easebuzz controller
        const mockReq = {
            body: {
                amount: depositAmount,
                userId: userId,
                userEmail: user.email,
                userName: userName,
                userPhone: userPhone
            }
        };
        
        // Create a mock response object to capture the result
        let paymentResult = null;
        const mockRes = {
            json: (data) => { paymentResult = data; },
            status: (code) => ({ json: (data) => { paymentResult = { status: code, ...data }; } })
        };
        
        // Call the Easebuzz initiate payment function
        await easebuzzController.initiatePayment(mockReq, mockRes);
        
        if (paymentResult && paymentResult.status === 1) {
            console.log('✅ Payment initiated successfully');
            res.json({
                success: true,
                message: 'Payment initiated successfully',
                payment_url: paymentResult.data.payment_url,
                redirect_url: paymentResult.data.redirect_url || paymentResult.data.payment_url
            });
        } else {
            console.log('❌ Payment initiation failed:', paymentResult);
            res.status(500).json({
                success: false,
                message: paymentResult?.message || 'Failed to initiate payment'
            });
        }
        
    } catch (error) {
        console.error('❌ Error in requestDeposit:', error);
        res.status(500).json({ 
            success: false,
            message: 'A server error occurred while initiating payment.' 
        });
    }
};

// --- ADDED: New feature from incoming change ---
exports.requestWithdrawal = async (req, res) => {
    const userId = req.user.user_id;
    const { amount } = req.body;
    // Enforce withdrawal window before any processing
    try {
        const windowStatus = await getWithdrawalWindow();
        if (!windowStatus.allowed) {
            return res.status(403).json({
                message: windowStatus.reason || 'Withdrawals are currently closed.',
                window: windowStatus
            });
        }
    } catch (e) {
        console.error('❌ Error checking withdrawal window:', e);
        return res.status(500).json({ message: 'Unable to verify withdrawal window. Please try again later.' });
    }
    if (!amount) {
        return res.status(400).json({ message: 'Withdrawal amount is required.' });
    }
    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
        return res.status(400).json({ message: 'A valid, positive withdrawal amount is required.' });
    }

    // Validate withdrawal amount is at least ₹50
    if (withdrawalAmount < 50) {
        return res.status(400).json({
            message: 'Minimum withdrawal amount is ₹50. Please enter an amount of ₹50 or more.'
        });
    }

    // Validate withdrawal amount does not exceed ₹25,000
    if (withdrawalAmount > 25000) {
        return res.status(400).json({
            message: 'Maximum withdrawal amount is ₹25,000. Please enter an amount of ₹25,000 or less.'
        });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const walletRes = await client.query('SELECT digital_money FROM wallet WHERE id = $1 FOR UPDATE', [userId]);
        if (walletRes.rows.length === 0) throw new Error('Wallet not found for this user.');
        
        const currentBalance = parseFloat(walletRes.rows[0].digital_money);
        if (currentBalance < withdrawalAmount) {
            return res.status(400).json({ message: 'Insufficient funds. Your withdrawal request exceeds your available balance.' });
        }

        const description = `User withdrawal request for ₹${withdrawalAmount.toFixed(2)} to registered bank account.`;
        const transactionQuery = `
            INSERT INTO transaction (user_id, transaction_type, amount, status, description)
            VALUES ($1, 'withdrawal', $2, 'pending', $3) RETURNING trans_id;
        `;
        const result = await client.query(transactionQuery, [userId, withdrawalAmount, description]);
        const transactionId = result.rows[0].trans_id;
        await client.query('COMMIT');

        // Note: External API sending moved to admin approval process

        try {
            await runPy('../utils/sendAdminNotificationEmail.py', [
                'Withdrawal request submitted',
                `User: ${userId}\nAmount: ₹${withdrawalAmount.toFixed(2)}`
            ]);
        } catch (e) {
            console.error('Admin email failed (withdrawal request):', e?.message || e);
        }

        res.status(201).json({ message: 'Your withdrawal request has been submitted and will be processed by the next day of your request.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error in requestWithdrawal:', error);
        res.status(500).json({ message: 'A server error occurred while submitting your request.' });
    } finally {
        client.release();
    }
};

// ✅ --- NEW: Function to get the logged-in user's deposit history ---
exports.getDepositHistory = async (req, res) => {
    try {
        // req.user.user_id comes from the 'protect' auth middleware
        const userId = req.user.user_id; 

        const query = `
            SELECT
                trans_id,
                created_at,
                amount,
                status,
                description,
                upi_transaction_id
            FROM transaction
            WHERE user_id = $1 AND transaction_type = 'deposit'
            ORDER BY created_at DESC;
        `;

        const { rows } = await db.query(query, [userId]);

        // Convert timestamps to IST for frontend display
        const formattedTransactions = rows.map(row => formatTimestampsForDisplay(row, ['created_at']));

        res.status(200).json(formattedTransactions);

    } catch (error) {
        console.error('❌ Error fetching deposit history:', error);
        res.status(500).json({ message: 'Server error while fetching deposit history.' });
    }
};

// ✅ --- NEW: Function to get the logged-in user's withdrawal history ---
exports.getWithdrawalHistory = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const query = `
            SELECT
                trans_id,
                created_at,
                amount,
                status,
                description
            FROM transaction
            WHERE user_id = $1 AND transaction_type = 'withdrawal'
            ORDER BY created_at DESC;
        `;
        
        const { rows } = await db.query(query, [userId]);

        // Convert timestamps to IST for frontend display
        const formattedTransactions = rows.map(row => formatTimestampsForDisplay(row, ['created_at']));

        res.status(200).json(formattedTransactions);

    } catch (error) {
        console.error('❌ Error fetching withdrawal history:', error);
        res.status(500).json({ message: 'Server error while fetching withdrawal history.' });
    }
};

// ✅ --- NEW: Function to cancel user's own pending withdrawal request ---
exports.cancelWithdrawal = async (req, res) => {
    const userId = req.user.user_id;
    const { transactionId } = req.body;

    if (!transactionId) {
        return res.status(400).json({ message: 'Transaction ID is required.' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Verify the transaction exists, belongs to the user, and is pending
        const transactionQuery = `
            SELECT * FROM transaction 
            WHERE trans_id = $1 
            AND user_id = $2 
            AND transaction_type = 'withdrawal' 
            AND status = 'pending'
            FOR UPDATE
        `;
        const transactionResult = await client.query(transactionQuery, [transactionId, userId]);

        if (transactionResult.rows.length === 0) {
            throw new Error('Transaction not found, already processed, or you do not have permission to cancel it.');
        }

        // Update transaction status to cancelled
        await client.query(
            `UPDATE transaction 
             SET status = 'cancelled', 
                 admin_comment = 'Cancelled by user'
             WHERE trans_id = $1`,
            [transactionId]
        );

        await client.query('COMMIT');

        res.status(200).json({ 
            message: 'Withdrawal request has been cancelled successfully.',
            transactionId: transactionId
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error cancelling withdrawal:', error);
        res.status(500).json({ message: error.message || 'Server error while cancelling withdrawal.' });
    } finally {
        client.release();
    }
};

// Public status endpoint for frontend to know whether to show/enable Withdraw
exports.getWithdrawalWindowStatus = async (req, res) => {
    try {
        const status = await getWithdrawalWindow();
        res.json(status);
    } catch (e) {
        console.error('❌ Error in getWithdrawalWindowStatus:', e);
        res.status(500).json({ allowed: false, reason: 'Unable to determine withdrawal window.' });
    }
};

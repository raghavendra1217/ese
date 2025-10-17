// backend/api/controllers/walletController.js

const db = require('../config/database');
const { formatTimestampsForDisplay } = require('../utils/timeUtils');
const path = require('path');
const { uploadFileToR2 } = require('../utils/cloudflareR2'); // Keep for new functions
const { runPy } = require('../utils/emailRunner');
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

// --- ADDED: New feature from incoming change ---
exports.requestDeposit = async (req, res) => {
    console.log('🔍 requestDeposit called with:', {
        body: req.body,
        file: req.file,
        user: req.user
    });
    
    const userId = req.user.user_id;
    const { amount, transactionId } = req.body;
    const paymentScreenshotFile = req.file;
    
    console.log('🔍 Parsed data:', { userId, amount, transactionId, paymentScreenshotFile });
    
    if (!amount || !transactionId) {
        console.log('❌ Validation failed: missing amount or transactionId');
        return res.status(400).json({ message: 'Amount and transaction ID are required.' });
    }
    
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
        console.log('❌ Validation failed: invalid amount');
        return res.status(400).json({ message: 'A valid, positive amount is required.' });
    }
    
    console.log('🔍 Starting database transaction for deposit:', { userId, depositAmount, transactionId });
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const timestamp = Date.now();
        let paymentProofUrl = null;
        if (paymentScreenshotFile) {
            console.log('🔍 Processing payment screenshot file');
            const screenshotFilename = `DEP_${userId}_${timestamp}${path.extname(paymentScreenshotFile.originalname)}`;
            paymentProofUrl = await uploadFileToR2(paymentScreenshotFile, 'deposits', screenshotFilename);
            console.log('🔍 Payment screenshot uploaded:', paymentProofUrl);
        } else {
            console.log('🔍 No payment screenshot provided, proceeding without it');
        }
        
        const description = `User deposit request for ₹${depositAmount.toFixed(2)}`;
        console.log('🔍 Inserting transaction with description:', description);
        
        const query = `
            INSERT INTO transaction (user_id, transaction_type, amount, status, description, upi_transaction_id, payment_proof_url)
            VALUES ($1, 'deposit', $2, 'pending', $3, $4, $5) RETURNING trans_id;
        `;
        const result = await client.query(query, [userId, depositAmount, description, transactionId, paymentProofUrl]);
        const transactionIdFromDB = result.rows[0].trans_id;
        
        console.log('🔍 Transaction inserted successfully with ID:', transactionIdFromDB);
        
        await client.query('COMMIT');
        console.log('🔍 Database transaction committed successfully');

        // Note: External API sending moved to admin approval process

        try {
            console.log('🔍 Attempting to send admin notification email');
            await runPy('../utils/sendAdminNotificationEmail.py', [
                'Deposit request submitted',
                `User: ${userId}\nAmount: ₹${depositAmount.toFixed(2)}\nUPI Txn ID: ${transactionId}`
            ]);
            console.log('🔍 Admin email sent successfully');
        } catch (e) {
            console.error('❌ Admin email failed (deposit request):', e?.message || e);
        }

        console.log('✅ Deposit request completed successfully');
        res.status(201).json({ message: 'Your deposit request has been submitted successfully and is awaiting approval.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error in requestDeposit:', error);
        res.status(500).json({ message: 'A server error occurred while submitting your request.' });
    } finally {
        client.release();
    }
};

// --- ADDED: New feature from incoming change ---
exports.requestWithdrawal = async (req, res) => {
    const userId = req.user.user_id;
    const { amount } = req.body;
    if (!amount) {
        return res.status(400).json({ message: 'Withdrawal amount is required.' });
    }
    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
        return res.status(400).json({ message: 'A valid, positive withdrawal amount is required.' });
    }

    // Validate withdrawal amount is at least ₹1,000
    if (withdrawalAmount < 1000) {
        return res.status(400).json({
            message: 'Minimum withdrawal amount is ₹1,000. Please enter an amount of ₹1,000 or more.'
        });
    }

    // Validate withdrawal amount does not exceed ₹50,000
    if (withdrawalAmount > 50000) {
        return res.status(400).json({
            message: 'Maximum withdrawal amount is ₹50,000. Please enter an amount of ₹50,000 or less.'
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

        res.status(201).json({ message: 'Your withdrawal request has been submitted and will be processed to your registered bank account.' });
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

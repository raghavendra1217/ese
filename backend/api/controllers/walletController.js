const db = require('../config/database');
<<<<<<< HEAD

exports.getWallet = async (req, res) => {
    const userId = req.user.user_id;
    const role = req.user.role;
    try {
        let walletRes = await db.query('SELECT * FROM wallet WHERE id = $1 AND role = $2', [userId, role]);
        let walletId;
        if (walletRes.rows.length === 0) {
            // Create new wallet_id
            const idRes = await db.query(`SELECT wallet_id FROM wallet ORDER BY wallet_id DESC LIMIT 1`);
            let nextNum = 1;
            if (idRes.rows.length > 0) {
                nextNum = parseInt(idRes.rows[0].wallet_id.split('_')[1], 10) + 1;
            }
            walletId = `w_${String(nextNum).padStart(3, '0')}`;
            await db.query('INSERT INTO wallet (wallet_id, id, role, digital_money) VALUES ($1, $2, $3, $4)', [walletId, userId, role, 0]);
            res.json({ wallet_id: walletId, id: userId, role, digital_money: 0 });
        } else {
            const wallet = walletRes.rows[0];
            res.json({ wallet_id: wallet.wallet_id, id: wallet.id, role: wallet.role, digital_money: wallet.digital_money });
        }
    } catch (error) {
        console.error('❌ Error fetching/creating wallet:', error);
        res.status(500).json({ message: 'Failed to fetch or create wallet.' });
    }
}; 
=======
const path = require('path');
const { uploadFileToR2 } = require('../utils/cloudflareR2');

// --- GET WALLET (Unchanged) ---
exports.getWallet = async (req, res) => {
    const userId = req.user.user_id;
    if (!userId) {
        return res.status(401).json({ message: 'Not authorized' });
    }

    const client = await db.connect();
    try {
        // Step 1: Get the wallet balance (as before)
        const walletQuery = 'SELECT digital_money FROM wallet WHERE id = $1';
        const walletResult = await client.query(walletQuery, [userId]);

        // Step 2: Check for any pending withdrawals for this user
        const pendingQuery = `
            SELECT 1 FROM transaction 
            WHERE user_id = $1 AND transaction_type = 'withdrawal' AND status = 'pending' 
            LIMIT 1;
        `;
        const pendingResult = await client.query(pendingQuery, [userId]);
        const hasPendingWithdrawal = pendingResult.rows.length > 0;

        if (walletResult.rows.length > 0) {
            // Wallet exists, return balance and pending status
            res.status(200).json({
                digital_money: parseFloat(walletResult.rows[0].digital_money),
                hasPendingWithdrawal: hasPendingWithdrawal // <-- ADDED
            });
        } else {
            // Wallet does not exist, create one
            await client.query('BEGIN');
            const newWalletResult = await client.query(
                'INSERT INTO wallet (id, digital_money) VALUES ($1, 0) RETURNING digital_money',
                [userId]
            );
            await client.query('COMMIT');

            // Return new balance and false for pending status (as it's a new wallet)
            res.status(200).json({
                digital_money: parseFloat(newWalletResult.rows[0].digital_money),
                hasPendingWithdrawal: false // <-- ADDED
            });
        }
    } catch (error) {
        await client.query('ROLLBACK').catch(err => console.error('Rollback failed:', err));
        console.error('❌ Error in getWallet:', error);
        res.status(500).json({ message: 'Server error while fetching wallet.' });
    } finally {
        client.release();
    }
};

// --- REQUEST DEPOSIT (Unchanged) ---
exports.requestDeposit = async (req, res) => {
    // ... no changes needed here.
    const userId = req.user.user_id;
    const { amount, transactionId } = req.body;
    const paymentScreenshotFile = req.file;
    if (!amount || !transactionId || !paymentScreenshotFile) {
        return res.status(400).json({ message: 'Amount, transaction ID, and a payment screenshot are required.' });
    }
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
        return res.status(400).json({ message: 'A valid, positive amount is required.' });
    }
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const timestamp = Date.now();
        const screenshotFilename = `DEP_${userId}_${timestamp}${path.extname(paymentScreenshotFile.originalname)}`;
        const paymentProofUrl = await uploadFileToR2(paymentScreenshotFile, 'deposits', screenshotFilename);
        const description = `User deposit request for ₹${depositAmount.toFixed(2)}`;
        const query = `
            INSERT INTO transaction 
            (user_id, transaction_type, amount, status, description, upi_transaction_id, payment_proof_url)
            VALUES ($1, 'deposit', $2, 'pending', $3, $4, $5)
            RETURNING trans_id;
        `;
        const params = [userId, depositAmount, description, transactionId, paymentProofUrl];
        await client.query(query, params);
        await client.query('COMMIT');
        res.status(201).json({ message: 'Your deposit request has been submitted successfully and is awaiting approval.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error in requestDeposit:', error);
        res.status(500).json({ message: 'An server error occurred while submitting your request.' });
    } finally {
        client.release();
    }
};


// --- MODIFIED FUNCTION: REQUEST WITHDRAWAL ---
exports.requestWithdrawal = async (req, res) => {
    const userId = req.user.user_id;
    // --- CHANGE: Removed 'upiId' from request body ---
    const { amount } = req.body;

    // --- CHANGE: Removed validation for 'upiId' ---
    if (!amount) {
        return res.status(400).json({ message: 'Withdrawal amount is required.' });
    }
    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
        return res.status(400).json({ message: 'A valid, positive withdrawal amount is required.' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const walletRes = await client.query(
            'SELECT digital_money FROM wallet WHERE id = $1 FOR UPDATE',
            [userId]
        );

        if (walletRes.rows.length === 0) {
            throw new Error('Wallet not found for this user.');
        }

        const currentBalance = parseFloat(walletRes.rows[0].digital_money);

        if (currentBalance < withdrawalAmount) {
            return res.status(400).json({ message: 'Insufficient funds. Your withdrawal request exceeds your available balance.' });
        }

        // --- CHANGE: Updated description and transaction query ---
        const description = `User withdrawal request for ₹${withdrawalAmount.toFixed(2)} to registered bank account.`;
        const transactionQuery = `
            INSERT INTO transaction 
            (user_id, transaction_type, amount, status, description)
            VALUES ($1, 'withdrawal', $2, 'pending', $3)
            RETURNING trans_id;
        `;
        
        // --- CHANGE: Updated parameters for the query ---
        await client.query(transactionQuery, [userId, withdrawalAmount, description]);

        await client.query('COMMIT');
        res.status(201).json({ message: 'Your withdrawal request has been submitted and will be processed to your registered bank account.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error in requestWithdrawal:', error);
        res.status(500).json({ message: 'A server error occurred while submitting your request.' });
    } finally {
        client.release();
    }
};
>>>>>>> d39126c (wallet update)

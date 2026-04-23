const db = require('../config/database');

// Submit product request
exports.submitProductRequest = async (req, res) => {
    const userId = req.user.user_id;
    const { amount, remarks } = req.body;

    if (!amount) {
        return res.status(400).json({ message: 'Amount is required.' });
    }

    const requestAmount = parseFloat(amount);
    if (isNaN(requestAmount) || requestAmount <= 0) {
        return res.status(400).json({ message: 'A valid, positive amount is required.' });
    }

    // Check if user has pending request
    const pendingCheck = await db.query(
        'SELECT request_id FROM product_requests WHERE user_id = $1 AND status = $2',
        [userId, 'pending']
    );

    if (pendingCheck.rows.length > 0) {
        return res.status(400).json({ 
            message: 'You already have a pending product request. Please wait for approval or cancel your existing request before submitting a new one.' 
        });
    }

    // Get user's wallet balance
    const walletRes = await db.query('SELECT digital_money FROM wallet WHERE id = $1', [userId]);
    if (walletRes.rows.length === 0) {
        return res.status(404).json({ message: 'Wallet not found.' });
    }

    const currentBalance = parseFloat(walletRes.rows[0].digital_money);
    if (currentBalance < requestAmount) {
        return res.status(400).json({ 
            message: 'Insufficient funds. Your request amount exceeds your available balance.' 
        });
    }

    try {
        const result = await db.query(
            `INSERT INTO product_requests (user_id, amount, remarks, status)
             VALUES ($1, $2, $3, 'pending') RETURNING request_id`,
            [userId, requestAmount, remarks || '']
        );

        const requestId = result.rows[0].request_id;

        // Send admin notification email
        try {
            const { runPy } = require('../utils/pythonRunner');
            await runPy('../utils/sendAdminNotificationEmail.py', [
                'Product request submitted',
                `User: ${userId}\nAmount: ₹${requestAmount.toFixed(2)}\nRemarks: ${remarks}`
            ]);
        } catch (e) {
            console.error('Admin email failed (product request):', e?.message || e);
        }

        res.status(201).json({ 
            message: 'Your product request has been submitted successfully and is awaiting approval.',
            requestId: requestId
        });

    } catch (error) {
        console.error('❌ Error in submitProductRequest:', error);
        
        // Check if it's a unique constraint violation (duplicate pending request)
        if (error.code === '23505' && error.constraint === 'idx_product_requests_unique_pending_per_user') {
            return res.status(400).json({ 
                message: 'You already have a pending product request. Please wait for approval or cancel your existing request before submitting a new one.' 
            });
        }
        
        res.status(500).json({ message: 'A server error occurred while submitting your request.' });
    }
};

// Get user's current pending request
exports.getCurrentPendingRequest = async (req, res) => {
    const userId = req.user.user_id;

    try {
        const result = await db.query(
            `SELECT request_id, amount, remarks, status, admin_comment, 
                    created_at, updated_at
             FROM product_requests 
             WHERE user_id = $1 AND status = 'pending'
             ORDER BY created_at DESC
             LIMIT 1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(200).json({ pendingRequest: null });
        }

        res.status(200).json({ pendingRequest: result.rows[0] });

    } catch (error) {
        console.error('❌ Error fetching pending request:', error);
        res.status(500).json({ message: 'Server error while fetching pending request.' });
    }
};

// Get user's product request history
exports.getProductRequestHistory = async (req, res) => {
    const userId = req.user.user_id;

    try {
        const result = await db.query(
            `SELECT request_id, amount, remarks, status, admin_comment, 
                    created_at, updated_at, approved_at, rejected_at
             FROM product_requests 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [userId]
        );

        res.status(200).json({ requests: result.rows });

    } catch (error) {
        console.error('❌ Error fetching product request history:', error);
        res.status(500).json({ message: 'Server error while fetching request history.' });
    }
};

// Cancel pending product request
exports.cancelProductRequest = async (req, res) => {
    const userId = req.user.user_id;
    const { requestId } = req.body;

    if (!requestId) {
        return res.status(400).json({ message: 'Request ID is required.' });
    }

    try {
        const result = await db.query(
            `UPDATE product_requests 
             SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
             WHERE request_id = $1 AND user_id = $2 AND status = 'pending'
             RETURNING request_id`,
            [requestId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                message: 'Request not found or cannot be cancelled.' 
            });
        }

        res.status(200).json({ message: 'Product request cancelled successfully.' });

    } catch (error) {
        console.error('❌ Error cancelling product request:', error);
        res.status(500).json({ message: 'Server error while cancelling request.' });
    }
};

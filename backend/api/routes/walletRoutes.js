const express = require('express');
const router = express.Router();
// ✅ Import the new controller functions
const { getWallet, requestDeposit, requestWithdrawal, getDepositHistory, getWithdrawalHistory, cancelWithdrawal } = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/wallet - Fetch user wallet (Unchanged)
router.get('/', protect, getWallet);

// POST /api/wallet/deposit - User initiates payment via Easebuzz gateway
router.post('/deposit', protect, requestDeposit);


// POST /api/wallet/withdraw - User requests a withdrawal (Unchanged)
router.post('/withdraw', protect, requestWithdrawal);

// ✅ --- NEW ROUTES ---
// GET /api/wallet/deposits - Fetch the logged-in user's deposit history
router.get('/deposits', protect, getDepositHistory);

// GET /api/wallet/withdrawals - Fetch the logged-in user's withdrawal history
router.get('/withdrawals', protect, getWithdrawalHistory);

// PUT /api/wallet/cancel-withdrawal - Cancel user's own pending withdrawal request
router.put('/cancel-withdrawal', protect, cancelWithdrawal);

// 🧪 TEST ENDPOINT - Remove this after testing
router.get('/test', (req, res) => {
    res.json({ 
        message: 'Wallet routes are working!', 
        timestamp: new Date().toISOString(),
        routes: {
            'GET /': 'Get wallet balance',
            'POST /deposit': 'Submit deposit request',
            'POST /withdraw': 'Submit withdrawal request',
            'GET /deposits': 'Get deposit history',
            'GET /withdrawals': 'Get withdrawal history'
        }
    });
});

// 🧪 DATABASE TEST ENDPOINT - Remove this after testing
router.get('/test-db', async (req, res) => {
    try {
        const db = require('../config/database');
        const client = await db.connect();
        
        // Test if transaction table exists
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'transaction'
            );
        `);
        
        if (tableCheck.rows[0].exists) {
            // Get table structure
            const structure = await client.query(`
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'transaction' 
                ORDER BY ordinal_position;
            `);
            
            // Test a simple insert (will be rolled back)
            await client.query('BEGIN');
            const testInsert = await client.query(`
                INSERT INTO transaction (user_id, transaction_type, amount, status, description) 
                VALUES ('test_user', 'test', 0, 'pending', 'Test transaction') 
                RETURNING trans_id;
            `);
            await client.query('ROLLBACK');
            
            res.json({
                success: true,
                message: 'Database connection and transaction table working!',
                tableExists: true,
                tableStructure: structure.rows,
                testInsert: 'Success (rolled back)',
                timestamp: new Date().toISOString()
            });
        } else {
            res.json({
                success: false,
                message: 'Transaction table does not exist!',
                tableExists: false,
                timestamp: new Date().toISOString()
            });
        }
        
        client.release();
    } catch (error) {
        console.error('❌ Database test error:', error);
        res.status(500).json({
            success: false,
            message: 'Database test failed',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
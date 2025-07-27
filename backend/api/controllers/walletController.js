const db = require('../config/database');

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
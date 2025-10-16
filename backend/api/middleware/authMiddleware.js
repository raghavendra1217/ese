// backend/api/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware to protect routes by verifying the JWT
const protect = async (req, res, next) => {
    let token;

    // helllo
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('🔍 JWT decoded:', decoded);

            const client = await db.connect();
            try {
                const { rows } = await client.query('SELECT user_id, email, role FROM login WHERE user_id = $1', [decoded.userId]);
                console.log('🔍 Database query result:', rows);
                
                if (rows.length === 0) {
                    console.log("❌ User not found in DB for userId:", decoded.userId);
                    return res.status(401).json({ message: 'Not authorized, user not found' });
                }
                
                req.user = rows[0];
                console.log('🔍 Auth middleware - Setting req.user:', req.user);
                next();
            } finally {
                client.release();
            }
        } catch (error) {
            console.log("❌ JWT Verification Failed:", error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        console.log("⛔ No token provided in headers");
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};


// Middleware to authorize based on user role
// Example usage: authorize('admin') or authorize('admin', 'vendor')
const authorize = (...roles) => {
    return (req, res, next) => {
        console.log('🔍 Authorization check:', { 
            user: req.user, 
            requiredRoles: roles, 
            userRole: req.user?.role,
            hasAccess: req.user && roles.includes(req.user.role)
        });
        
        if (!req.user || !roles.includes(req.user.role)) {
            console.log('❌ Authorization failed:', { 
                hasUser: !!req.user, 
                userRole: req.user?.role, 
                requiredRoles: roles 
            });
            return res.status(403).json({ message: 'User role not authorized to access this route' }); // 403 Forbidden
        }
        console.log('✅ Authorization passed');
        next();
    };
};

module.exports = { protect, authorize };
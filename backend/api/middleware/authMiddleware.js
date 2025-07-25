// backend/api/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware to protect routes by verifying the JWT
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (e.g., "Bearer <token>")
            token = req.headers.authorization.split(' ')[1];

            // Verify the token using your secret
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach the user's info to the request object (excluding password)
            // This makes req.user available in all protected routes
            const { rows } = await db.query('SELECT user_id, email, role FROM login WHERE user_id = $1', [decoded.userId]);
            if (rows.length === 0) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            req.user = rows[0];
            
            next(); // Proceed to the next middleware or controller
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Middleware to authorize based on user role
// Example usage: authorize('admin') or authorize('admin', 'vendor')
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'User role not authorized to access this route' }); // 403 Forbidden
        }
        next();
    };
};

module.exports = { protect, authorize };
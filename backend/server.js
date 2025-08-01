// backend/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');

const db = require('./api/config/database');
const authRoutes = require('./api/routes/authRoutes');
const resumeRoutes = require('./api/routes/resumeRoutes');
const adminRoutes = require('./api/routes/adminRoutes');
const vendorRoutes = require('./api/routes/vendorRoutes');
const productRoutes = require('./api/routes/productRoutes');
const tradingRoutes = require('./api/routes/tradingRoutes');
const walletRoutes = require('./api/routes/walletRoutes');

const PORT = process.env.PORT || 5000;
const app = express();

// --- CORS Setup ---
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:10000',
  'https://2df35b2f33ff.ngrok-free.app',
  'https://esepapertrading.vercel.app',
  'https://esepapertrading.onrender.com',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// --- Middleware ---
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// --- Log Request Body ---
app.use((req, res, next) => {
  console.log('--- Body of Incoming Request ---');
  console.log(req.body);
  console.log('--- End of Body ---');
  next();
});

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/auth', require('./api/routes/authRoutes')); // Reuse authRoutes for OTP


// // --- Serve Uploaded Product Images ---
// app.use('/products', express.static(path.join(__dirname, 'public/products')));
// app.use('/passport_photos', express.static(path.join(__dirname, 'public/passport_photos')));
// app.use('/payment_screenshots', express.static(path.join(__dirname, 'public/payment_screenshots')));
// app.use('/trade_proofs', express.static(path.join(__dirname, 'public/trade_proofs')));

app.use('/static-assets', express.static(path.join(__dirname, '..', 'frontend', 'public')));



// --- Serve React Frontend Build ---
const buildPath = path.join(__dirname, '..', 'frontend', 'build');
app.use(express.static(buildPath));

// --- Serve Admin and Vendor Routes ---
app.use('/admin', express.static(buildPath));
app.use('/vendor', express.static(buildPath));

// --- Fallback to index.html for React Router (SPA Handling) ---
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// --- Start Server ---
const startServer = async () => {
  try {
    console.log('🟡 Attempting to connect to the database...');
    const result = await db.query('SELECT NOW()');
    console.log(`✅ Database connection successful. DB time: ${result.rows[0].now}`);

    app.listen(PORT, '0.0.0.0', () => {
      console.log('----------------------------------------------------');
      console.log(`🚀 Server is live at: http://localhost:${PORT}`);
      console.log('🗒️  Logging is enabled.');
      console.log('📦 Serving React app from /build');
      console.log('----------------------------------------------------');
    });
  } catch (error) {
    console.error('❌ FATAL: Database connection failed.');
    console.error(error.message);
    process.exit(1);
  }
};

startServer();

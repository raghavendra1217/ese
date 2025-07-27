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

const PORT = process.env.PORT || 5000;
const app = express();

const allowedOrigins = ['http://localhost:3000', 'https://esepapertrading.vercel.app'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: false
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// Optional: Log request body for debugging
app.use((req, res, next) => {
  console.log('--- Request Body ---');
  console.log(req.body);
  console.log('---------------------');
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/trading', tradingRoutes);

// Static Uploads
app.use('/images/products', express.static(path.join(__dirname, 'public/images/products')));

// --- Serve Frontend (React) ---
const buildPath = path.join(__dirname, '..', 'frontend', 'build');
app.use(express.static(buildPath));

// Serve manifest.json explicitly
app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(buildPath, 'manifest.json'));
});

// Catch-all for React routes
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// --- Start Server ---
const startServer = async () => {
  try {
    console.log('🟡 Connecting to database...');
    const result = await db.query('SELECT NOW()');
    console.log(`✅ Connected to DB. Time: ${result.rows[0].now}`);

    app.listen(PORT, '0.0.0.0', () => {
      console.log('----------------------------------------');
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log('🌐 Ready to serve frontend and API');
      console.log('----------------------------------------');
    });
  } catch (error) {
    console.error('❌ DB connection failed. Exiting.');
    console.error(error.message);
    process.exit(1);
  }
};

startServer();

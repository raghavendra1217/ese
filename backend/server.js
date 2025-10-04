// backend/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');

const db = require('./api/config/database');
const authRoutes = require('./api/routes/authRoutes');
const adminRoutes = require('./api/routes/adminRoutes');
const vendorRoutes = require('./api/routes/vendorRoutes');
const productRoutes = require('./api/routes/productRoutes');
const wildProductRoutes = require('./api/routes/wildProductRoutes');
const tradingRoutes = require('./api/routes/tradingRoutes');
const walletRoutes = require('./api/routes/walletRoutes');
const tableRoutes = require('./api/routes/tableRoutes');
const integrationRoutes = require('./api/routes/integrationRoutes');
const investorRoutes = require('./api/routes/investorRoutes');
const htmlRoutes = require('./api/routes/htmlRoutes');
const dashboardRoutes = require('./api/routes/dashboardRoutes');
const statusRoutes = require('./api/routes/statusRoutes');
const quickRegRoutes = require('./api/routes/quickRegRoutes');
const payslipRoutes = require('./api/routes/payslipRoutes');
const coordinatorRoutes = require('./api/routes/coordinatorRoutes');
const { startCompressorMonitoring } = require('./api/utils/statusMonitor');

const PORT = process.env.PORT || 5000;
const app = express();


// --- CORS Setup ---
const allowedOrigins = [
  'http://localhost:3000', // Your local frontend dev server
  'http://localhost:5000', // The backend itself
  'http://localhost:10000', 
  'https://8d1806552441.ngrok-free.app',// Another possible port
  'https://esepapertrading.onrender.com'
];


app.use(cors({
  origin: function (origin, callback) {
    // ✅ This is the new, more flexible logic
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // Allow if the origin is in our list OR if it's an ngrok URL
    if (allowedOrigins.includes(origin) || origin.endsWith('.ngrok-free.app')) {
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
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Log Request Body ---
app.use((req, res, next) => {
  // Only log API requests, not static files
  if (req.url.startsWith('/api/')) {
    console.log('🌐 API request:', req.method, req.url);
  }
  next();
});

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/wild-products', wildProductRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/table', tableRoutes);
app.use('/api/transactions', integrationRoutes);
app.use('/api/investors', investorRoutes);
app.use('/api/html', htmlRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/quick-reg', quickRegRoutes);
app.use('/api/payslip', payslipRoutes);
app.use('/api/coordinators', coordinatorRoutes);

 

// --- Error Handling Middleware ---
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error occurred:', error);
  console.error('❌ Error details:', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  res.status(500).json({
    message: 'Internal server error occurred',
    error: error.message,
    timestamp: new Date().toISOString()
  });
});

// --- Serve Static Images and Files ---
const imagesBuildPath = path.join(__dirname, '..', 'frontend', 'build', 'images');

// Serve images with explicit options
app.use('/images', express.static(imagesBuildPath, {
  setHeaders: (res, path) => {
    res.set('Cache-Control', 'public, max-age=31536000');
  }
}));

app.use('/products', express.static(path.join(__dirname, 'public/products')));
app.use('/passport_photos', express.static(path.join(__dirname, 'public/passport_photos')));
app.use('/payment_screenshots', express.static(path.join(__dirname, 'public/payment_screenshots')));
app.use('/trade_proofs', express.static(path.join(__dirname, 'public/trade_proofs')));

app.use('/static-assets', express.static(path.join(__dirname, '..', 'frontend', 'public')));

// --- Serve React Frontend Build ---
const buildPath = path.join(__dirname, '..', 'frontend', 'build');
app.use(express.static(buildPath));

// --- Serve Admin and Vendor Routes ---
app.use('/admin', express.static(buildPath));
app.use('/vendor', express.static(buildPath));

app.use('/admin/manage-profile', express.static(buildPath));
// --- 404 Handler for API routes only ---
app.use('/api/*', (req, res) => {
  console.log('❌ 404 - API route not found:', req.method, req.url);
  res.status(404).json({
    message: 'API route not found',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });
});




// --- Fallback to index.html for React Router (SPA Handling) ---
app.get('*', (req, res) => {
  // Serve the React app for all non-API routes
  // This allows React Router to handle client-side routing
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
      
      // Start compressor service monitoring
      console.log('🔍 Starting external service monitoring...');
      const monitor = startCompressorMonitoring(15); // Check every 15 minutes
      monitor.start();
      console.log('✅ Compressor service monitoring started');
    });
  } catch (error) {
    console.error('❌ FATAL: Database connection failed.');
    console.error(error.message);
    process.exit(1);
  }
};

startServer();

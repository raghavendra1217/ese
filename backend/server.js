// backend/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');


// hi
// hello

const db = require('./api/config/database');
const { testSupabaseConnection } = require('./api/config/supabase');
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
const resumeRoutes = require('./api/routes/resumeRoutes');
const productRequestRoutes = require('./api/routes/productRequestRoutes');
const easebuzzRoutes = require('./api/routes/easebuzzRoutes');
const { startCompressorMonitoring } = require('./api/utils/statusMonitor');

const PORT = process.env.PORT || 10000;
const app = express();


// --- CORS Setup ---
const allowedOrigins = [
  'http://localhost:3000', // Your local frontend dev server
  'http://localhost:5000', // The backend itself
  'http://localhost:10000', 
  'https://esepapertrading.onrender.com',
  'https://pay.easebuzz.in', // Easebuzz payment gateway
  'https://testpay.easebuzz.in' // Easebuzz test payment gateway
];


app.use(cors({
  origin: function (origin, callback) {
    console.log('🔍 CORS Check - Origin:', origin);
    
    // Allow requests with no origin or null origin (like mobile apps, Postman, or direct API calls)
    if (!origin || origin === 'null') {
      console.log('✅ CORS: Allowing request with no/null origin');
      return callback(null, true);
    }
    
    // Allow if the origin is in our list OR if it's an ngrok URL
    if (allowedOrigins.includes(origin) || origin.endsWith('.ngrok-free.app')) {
      console.log('✅ CORS: Allowing origin:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS: Blocking origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// --- Additional CORS Headers (fallback) ---
app.use((req, res, next) => {
  // Set CORS headers for all requests
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// --- Middleware ---
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Handle Preflight OPTIONS Requests ---
app.options('*', (req, res) => {
  console.log('🔄 Preflight OPTIONS request:', req.method, req.url);
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// --- Log Request Body ---
app.use((req, res, next) => {
  // Only log API requests, not static files
  if (req.url.startsWith('/api/')) {
    console.log('🌐 API request:', req.method, req.url);
    console.log('🌐 Origin:', req.headers.origin);
    console.log('🌐 User-Agent:', req.headers['user-agent']);
    if (req.method === 'OPTIONS') {
      console.log('🔄 Preflight request detected');
    }
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
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/product-requests', productRequestRoutes);
app.use('/api/payment/easebuzz', easebuzzRoutes);

 

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
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
  
  // Handle CORS errors specifically
  if (error.message === 'Not allowed by CORS') {
    console.error('🚫 CORS Error - Origin not allowed:', req.headers.origin);
    return res.status(403).json({
      message: 'CORS policy violation',
      error: 'Origin not allowed',
      origin: req.headers.origin,
      allowedOrigins: allowedOrigins,
      timestamp: new Date().toISOString()
    });
  }
  
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
app.use('/coordinator', express.static(buildPath));

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




// --- Payment Result Pages ---
app.get('/payment-success', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.get('/payment-failure', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
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

    // Test Supabase bucket storage connection (non-blocking)
    try {
      await testSupabaseConnection();
    } catch (error) {
      console.log('⚠️  Supabase connection test failed, but continuing server startup...');
      console.log('   This may affect file upload functionality.');
    }

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

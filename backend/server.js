// backend/server.js

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan'); // --- NEW: Import the morgan logger ---
const { exec } = require('child_process');




// --- Import Database and Routers ---
const db = require('./api/config/database');
const authRoutes = require('./api/routes/authRoutes');
const resumeRoutes = require('./api/routes/resumeRoutes');
const adminRoutes = require('./api/routes/adminRoutes');
const vendorRoutes = require('./api/routes/vendorRoutes');
const productRoutes = require('./api/routes/productRoutes');
const tradingRoutes = require('./api/routes/tradingRoutes');

const PORT = process.env.PORT || 5000;
const app = express();

// --- Middleware Setup ---



// 1. CORS Configuration
app.use(cors({
  origin: 'http://localhost:3000'
}));

// 2. Request Logger
// --- NEW: Use morgan for logging. 'dev' is a predefined format that's great for development.
// This should be one of the first middleware to run.
app.use(morgan('dev')); 

// 3. Body Parser
app.use(express.json({ limit: '10mb' }));

const logRequestBody = (req, res, next) => {
  console.log('--- Body of Incoming Request ---');
  console.log(req.body);
  console.log('--- End of Body ---');
  next(); // Don't forget to call next() to pass the request along!
};
app.use(logRequestBody);

// 4. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/trade', tradingRoutes);

// 5. Static Folder for Uploads
app.use(express.static(path.join(__dirname, 'public')));


// --- Server Start-up Logic ---
const startServer = async () => {
  try {
    console.log('🟡 Attempting to connect to the database...');
    const result = await db.query('SELECT NOW()');
    console.log(`✅ Database connection successful. DB time: ${result.rows[0].now}`);

    app.listen(PORT, () => {
      console.log('----------------------------------------------------');
      console.log(`🚀 API Server is live at: http://localhost:${PORT}`);
      console.log('🗒️  Request logging is enabled.');
      console.log('➡️  To view your app, open your frontend dev server.');
      console.log('----------------------------------------------------');
    });
  } catch (error) {
    console.error('❌ FATAL: Failed to connect to the database. Server is shutting down.');
    console.error(error.message);
    process.exit(1);
  }
};

// --- Run the Server ---
startServer();
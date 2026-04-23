// Easebuzz Payment Gateway Configuration
require('dotenv').config();

// Determine base URL based on environment
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 10000;
const BASE_URL = process.env.BASE_URL || (NODE_ENV === 'production' 
  ? 'https://esepapertrading.onrender.com' 
  : `http://localhost:${PORT}`);

const config = {
  // Easebuzz credentials
  key: process.env.EASEBUZZ_KEY,
  salt: process.env.EASEBUZZ_SALT,
  env: process.env.EASEBUZZ_ENV || 'test', // 'test' or 'prod'
  enable_iframe: process.env.EASEBUZZ_IFRAME || '0', // '0' for redirect, '1' for iframe
  
  // URLs for callbacks - dynamically generated based on environment
  success_url: process.env.EASEBUZZ_SUCCESS_URL || `${BASE_URL}/payment-success`,
  failure_url: process.env.EASEBUZZ_FAILURE_URL || `${BASE_URL}/api/payment/easebuzz/failure`,
  registration_success_url: process.env.EASEBUZZ_REG_SUCCESS_URL || `${BASE_URL}/api/payment/easebuzz/registration/success`,
  registration_failure_url: process.env.EASEBUZZ_REG_FAILURE_URL || `${BASE_URL}/api/payment/easebuzz/failure`,
  webhook_url: process.env.EASEBUZZ_WEBHOOK_URL || `${BASE_URL}/api/payment/easebuzz/webhook`,
  
  // Base URL for logging
  base_url: BASE_URL,
  
  // Payment gateway URLs
  getPaymentUrl: function() {
    if (this.env === 'prod') {
      return 'https://pay.easebuzz.in/';
    } else {
      return 'https://testpay.easebuzz.in/';
    }
  },
  
  // Log configuration on startup
  logConfig: function() {
    console.log('🔍 Easebuzz Configuration:');
    console.log('   Environment:', this.env);
    console.log('   Base URL:', this.base_url);
    console.log('   Success URL:', this.success_url);
    console.log('   Failure URL:', this.failure_url);
    console.log('   Registration Success URL:', this.registration_success_url);
    console.log('   Registration Failure URL:', this.registration_failure_url);
    console.log('   Webhook URL:', this.webhook_url);
    console.log('   Payment Gateway URL:', this.getPaymentUrl());
  },
  
  // Validate configuration
  isValid: function() {
    return this.key && this.salt && this.env;
  }
};

module.exports = config;

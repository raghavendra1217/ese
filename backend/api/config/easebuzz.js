// Easebuzz Payment Gateway Configuration
require('dotenv').config();

const config = {
  // Easebuzz credentials
  key: process.env.EASEBUZZ_KEY,
  salt: process.env.EASEBUZZ_SALT,
  env: process.env.EASEBUZZ_ENV || 'test', // 'test' or 'prod'
  enable_iframe: process.env.EASEBUZZ_IFRAME || '0', // '0' for redirect, '1' for iframe
  
  // URLs for callbacks
  success_url: process.env.EASEBUZZ_SUCCESS_URL || 'https://esepapertrading.onrender.com/payment-success',
  failure_url: process.env.EASEBUZZ_FAILURE_URL || 'https://esepapertrading.onrender.com/payment-failure',
  webhook_url: process.env.EASEBUZZ_WEBHOOK_URL || 'http://localhost:10000/api/payment/easebuzz/webhook',
  
  // Payment gateway URLs
  getPaymentUrl: function() {
    if (this.env === 'prod') {
      return 'https://pay.easebuzz.in/';
    } else {
      return 'https://testpay.easebuzz.in/';
    }
  },
  
  // Validate configuration
  isValid: function() {
    return this.key && this.salt && this.env;
  }
};

module.exports = config;

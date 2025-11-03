// Easebuzz Payment Gateway Controller
const sha512 = require('js-sha512');
const config = require('../config/easebuzz');
const db = require('../config/database');

// Utility function to make HTTP requests
const makeRequest = async (url, data, method = 'POST') => {
  const request = require('request');
  const options = {
    method: method,
    url: url,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    form: data,
  };
  
  return new Promise((resolve, reject) => {
    request(options, (error, response) => {
      if (response) {
        try {
          const data = JSON.parse(response.body);
          resolve(data);
        } catch (e) {
          resolve({ status: 0, data: 'Invalid response format' });
        }
      } else {
        reject(error);
      }
    });
  });
};

// Generate hash for payment initiation
const generateHash = (data) => {
  let hashstring = config.key + "|" + data.txnid + "|" + data.amount + "|" + data.productinfo + "|" + data.name + "|" + data.email +
    "|" + (data.udf1 || '') + "|" + (data.udf2 || '') + "|" + (data.udf3 || '') + "|" + (data.udf4 || '') + "|" + (data.udf5 || '') + 
    "|" + (data.udf6 || '') + "|" + (data.udf7 || '') + "|" + (data.udf8 || '') + "|" + (data.udf9 || '') + "|" + (data.udf10 || '');
  hashstring += "|" + config.salt;
  return sha512.sha512(hashstring);
};

// Validate payment response hash
const validateResponseHash = (response) => {
  const hashstring = config.salt + "|" + response.status + "|" + (response.udf10 || '') + "|" + (response.udf9 || '') + "|" + (response.udf8 || '') + "|" + (response.udf7 || '') +
    "|" + (response.udf6 || '') + "|" + (response.udf5 || '') + "|" + (response.udf4 || '') + "|" + (response.udf3 || '') + "|" + (response.udf2 || '') + "|" + (response.udf1 || '') + "|" +
    response.email + "|" + response.firstname + "|" + response.productinfo + "|" + response.amount + "|" + response.txnid + "|" + config.key;
  const hash_key = sha512.sha512(hashstring);
  return hash_key === response.hash;
};

// Initiate payment
exports.initiatePayment = async (req, res) => {
  try {
    const { amount, userId, userEmail, userName, userPhone } = req.body;
    
    // Validate required fields
    if (!amount || !userId || !userEmail || !userName || !userPhone) {
      return res.status(400).json({
        status: 0,
        message: 'Missing required fields: amount, userId, userEmail, userName, userPhone'
      });
    }
    
    // Validate amount
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({
        status: 0,
        message: 'Invalid amount. Please enter a valid positive amount.'
      });
    }
    
    // Minimum amount validation (from environment variable)
    const minDepositAmount = parseFloat(process.env.MIN_DEPOSIT_AMOUNT) || 100;
    if (depositAmount < minDepositAmount) {
      return res.status(400).json({
        status: 0,
        message: `Minimum deposit amount is ₹${minDepositAmount}.`
      });
    }
    
    // Generate unique transaction ID
    const timestamp = Date.now();
    const txnid = `TXN_${userId}_${timestamp}`;
    
    // Prepare payment data (using 'name' for hash generation, will map to 'firstname' in form)
    const paymentData = {
      txnid: txnid,
      amount: depositAmount.toFixed(2),
      productinfo: 'Wallet Deposit',
      name: userName, // Used for hash generation
      email: userEmail,
      phone: userPhone,
      surl: config.success_url,
      furl: config.failure_url,
      udf1: userId, // Store user ID in UDF1
      udf2: 'wallet_deposit', // Store transaction type in UDF2
      udf3: '', // Additional fields can be used for other data
      udf4: '',
      udf5: '',
      udf6: '',
      udf7: '',
      udf8: '',
      udf9: '',
      udf10: ''
    };
    
    // Generate hash
    const hash = generateHash(paymentData);
    paymentData.hash = hash;
    
    // Create form data for API call (map 'name' to 'firstname')
    const formData = {
      'key': config.key,
      'txnid': paymentData.txnid,
      'amount': paymentData.amount,
      'email': paymentData.email,
      'phone': paymentData.phone,
      'firstname': paymentData.name, // Map name to firstname
      'udf1': paymentData.udf1 || '',
      'udf2': paymentData.udf2 || '',
      'udf3': paymentData.udf3 || '',
      'udf4': paymentData.udf4 || '',
      'udf5': paymentData.udf5 || '',
      'hash': paymentData.hash,
      'productinfo': paymentData.productinfo,
      'udf6': paymentData.udf6 || '',
      'udf7': paymentData.udf7 || '',
      'udf8': paymentData.udf8 || '',
      'udf9': paymentData.udf9 || '',
      'udf10': paymentData.udf10 || '',
      'furl': paymentData.furl,
      'surl': paymentData.surl
    };
    
    // Store payment record in database
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      
      // Insert into easebuzz_payments table
      const insertQuery = `
        INSERT INTO easebuzz_payments (
          easebuzz_txn_id, user_id, amount, currency, productinfo,
          customer_name, customer_email, customer_phone, payment_status,
          success_url, failure_url, udf1, udf2, udf3, udf4, udf5,
          udf6, udf7, udf8, udf9, udf10, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        RETURNING id;
      `;
      
      const result = await client.query(insertQuery, [
        txnid, userId, depositAmount, 'INR', paymentData.productinfo,
        userName, userEmail, userPhone, 'initiated',
        config.success_url, config.failure_url,
        paymentData.udf1, paymentData.udf2, paymentData.udf3, paymentData.udf4, paymentData.udf5,
        paymentData.udf6, paymentData.udf7, paymentData.udf8, paymentData.udf9, paymentData.udf10,
        new Date()
      ]);
      
      const paymentId = result.rows[0].id;
      
      await client.query('COMMIT');
      
      // Call Easebuzz API to initiate payment
      const paymentUrl = config.getPaymentUrl();
      const apiUrl = paymentUrl + 'payment/initiateLink';
      
      console.log('🔍 Easebuzz API Debug:');
      console.log('Payment URL:', paymentUrl);
      console.log('API URL:', apiUrl);
      console.log('Form Data:', formData);
      console.log('Config:', {
        key: config.key ? 'Set' : 'Not Set',
        salt: config.salt ? 'Set' : 'Not Set',
        env: config.env
      });
      
      let apiResponse;
      try {
        apiResponse = await makeRequest(apiUrl, formData);
        console.log('🔍 Easebuzz API Response:', apiResponse);
      } catch (apiError) {
        console.error('❌ Easebuzz API Call Failed:', apiError);
        throw new Error('Failed to connect to payment gateway: ' + apiError.message);
      }
      
      if (apiResponse.status === 1 && apiResponse.data) {
        // Update payment record with access key
        await client.query(
          'UPDATE easebuzz_payments SET easebuzz_payment_id = $1, gateway_response = $2 WHERE id = $3',
          [apiResponse.data, JSON.stringify(apiResponse), paymentId]
        );
        
        // Return payment URL or redirect
        if (config.enable_iframe === '1') {
          res.json({
            status: 1,
            data: {
              payment_url: paymentUrl + 'pay/' + apiResponse.data,
              access_key: apiResponse.data,
              iframe_mode: true
            }
          });
        } else {
          res.json({
            status: 1,
            data: {
              payment_url: paymentUrl + 'pay/' + apiResponse.data,
              redirect_url: paymentUrl + 'pay/' + apiResponse.data
            }
          });
        }
      } else {
        console.error('❌ Easebuzz API Error:', apiResponse);
        throw new Error(apiResponse.data || apiResponse.message || 'Failed to initiate payment');
      }
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({
      status: 0,
      message: 'Failed to initiate payment: ' + error.message
    });
  }
};

// Handle payment success callback
exports.handleSuccess = async (req, res) => {
  try {
    const response = req.body;
    
    // Validate hash
    if (!validateResponseHash(response)) {
      console.error('Hash validation failed for success callback');
      return res.status(400).send('Hash validation failed');
    }
    
    // Update payment record
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      
      // Update easebuzz_payments table
      await client.query(`
        UPDATE easebuzz_payments 
        SET payment_status = $1, gateway_response = $2, payment_completed_at = $3, hash_verified = $4
        WHERE easebuzz_txn_id = $5
      `, [
        response.status === 'success' ? 'success' : 'failed',
        JSON.stringify(response),
        new Date(),
        true,
        response.txnid
      ]);
      
      // If payment is successful, update wallet balance
      if (response.status === 'success') {
        const paymentRecord = await client.query(
          'SELECT * FROM easebuzz_payments WHERE easebuzz_txn_id = $1',
          [response.txnid]
        );
        
        if (paymentRecord.rows.length > 0) {
          const payment = paymentRecord.rows[0];
          
          // Update wallet balance and get the new balance
          const walletUpdateResult = await client.query(`
            UPDATE wallet 
            SET digital_money = digital_money + $1, last_updated_on = $2
            WHERE id = $3
            RETURNING digital_money
          `, [payment.amount, new Date(), payment.user_id]);
          
          const newBalance = walletUpdateResult.rows[0].digital_money;
          
          // Create transaction record with balance_after_transaction and get the trans_id
          const transactionResult = await client.query(`
            INSERT INTO transaction (user_id, transaction_type, amount, status, description, payment_gateway, easebuzz_payment_id, balance_after_transaction)
            VALUES ($1, 'deposit', $2, 'completed', $3, 'easebuzz', $4, $5)
            RETURNING trans_id
          `, [
            payment.user_id,
            payment.amount,
            `Wallet deposit via Easebuzz - ${response.txnid}`,
            payment.id,
            newBalance
          ]);
          
          const transactionId = transactionResult.rows[0].trans_id;
          
          // Update easebuzz_payments table with the internal_txn_id
          await client.query(`
            UPDATE easebuzz_payments 
            SET internal_txn_id = $1
            WHERE id = $2
          `, [transactionId, payment.id]);
        }
      }
      
      await client.query('COMMIT');
      
      // Redirect to success page
      res.redirect('/payment-success?txnid=' + response.txnid + '&amount=' + response.amount);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error handling payment success:', error);
    res.redirect('/payment-failure?error=processing_error&returnTo=wallet');
  }
};

// Handle payment failure callback
exports.handleFailure = async (req, res) => {
  try {
    const response = req.body;
    
    // Update payment record
    const client = await db.connect();
    try {
      await client.query(`
        UPDATE easebuzz_payments 
        SET payment_status = 'failed', gateway_response = $1, payment_completed_at = $2
        WHERE easebuzz_txn_id = $2
      `, [JSON.stringify(response), new Date(), response.txnid]);
      
    } catch (error) {
      console.error('Error updating failed payment:', error);
    } finally {
      client.release();
    }
    
    // Determine returnTo based on transaction type (from UDF2 or default to wallet)
    let returnTo = 'wallet'; // Default
    if (response.udf2) {
      // UDF2 stores transaction type
      if (response.udf2.includes('registration') || response.udf2.includes('register')) {
        returnTo = 'registration';
      } else if (response.udf2.includes('quick')) {
        returnTo = 'quick-register';
      }
    }
    
    // Redirect to failure page with returnTo parameter
    res.redirect('/payment-failure?txnid=' + response.txnid + '&error=' + (response.error || 'payment_failed') + '&returnTo=' + returnTo);
    
  } catch (error) {
    console.error('Error handling payment failure:', error);
    res.redirect('/payment-failure?error=processing_error&returnTo=wallet');
  }
};

// Handle webhook notifications
exports.handleWebhook = async (req, res) => {
  try {
    const response = req.body;
    
    // Validate hash
    if (!validateResponseHash(response)) {
      console.error('Hash validation failed for webhook');
      return res.status(400).send('Hash validation failed');
    }
    
    // Update payment record
    const client = await db.connect();
    try {
      await client.query(`
        UPDATE easebuzz_payments 
        SET payment_status = $1, gateway_response = $2, webhook_received = $3, webhook_count = webhook_count + 1
        WHERE easebuzz_txn_id = $4
      `, [
        response.status === 'success' ? 'success' : 'failed',
        JSON.stringify(response),
        true,
        response.txnid
      ]);
      
      res.status(200).send('Webhook processed successfully');
      
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).send('Webhook processing failed');
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).send('Webhook processing failed');
  }
};

// Get payment status
exports.getPaymentStatus = async (req, res) => {
  try {
    const { txnid } = req.params;
    
    const result = await db.query(
      'SELECT * FROM easebuzz_payments WHERE easebuzz_txn_id = $1',
      [txnid]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 0,
        message: 'Payment not found'
      });
    }
    
    const payment = result.rows[0];
    res.json({
      status: 1,
      data: {
        txnid: payment.easebuzz_txn_id,
        amount: payment.amount,
        status: payment.payment_status,
        created_at: payment.created_at,
        completed_at: payment.payment_completed_at
      }
    });
    
  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(500).json({
      status: 0,
      message: 'Failed to get payment status'
    });
  }
};

// Get payment history for user
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const result = await db.query(`
      SELECT easebuzz_txn_id, amount, payment_status, created_at, payment_completed_at
      FROM easebuzz_payments 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [userId]);
    
    res.json({
      status: 1,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error getting payment history:', error);
    res.status(500).json({
      status: 0,
      message: 'Failed to get payment history'
    });
  }
};

// Initiate registration payment (public endpoint - no auth required)
exports.initiateRegistrationPayment = async (req, res) => {
  try {
    console.log('🔍 Registration Payment Initiation - Request Body:', JSON.stringify(req.body, null, 2));
    let { amount, email, phoneNumber, name } = req.body;
    
    // Trim whitespace from all string fields
    if (typeof email === 'string') email = email.trim();
    if (typeof phoneNumber === 'string') phoneNumber = phoneNumber.trim();
    if (typeof name === 'string') name = name.trim();
    
    // Validate required fields (check after trimming)
    if (!amount || !email || !phoneNumber || !name) {
      return res.status(400).json({
        status: 0,
        message: 'Missing required fields: amount, email, phoneNumber, name'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: 0,
        message: 'Invalid email format. Please enter a valid email address.'
      });
    }
    
    // Validate phone number format (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        status: 0,
        message: 'Invalid phone number format. Please enter a valid 10-digit phone number.'
      });
    }
    
    // Validate name (not empty after trim, minimum length)
    if (name.length < 2) {
      return res.status(400).json({
        status: 0,
        message: 'Name must be at least 2 characters long.'
      });
    }
    
    // Validate amount
    const registrationAmount = parseFloat(amount);
    if (isNaN(registrationAmount) || registrationAmount <= 0) {
      return res.status(400).json({
        status: 0,
        message: 'Invalid amount. Please enter a valid positive amount.'
      });
    }
    
    // Generate unique transaction ID
    const timestamp = Date.now();
    const txnid = `REG_${email.replace('@', '_').replace('.', '_')}_${timestamp}`;
    
    // Prepare payment data
    const paymentData = {
      txnid: txnid,
      amount: registrationAmount.toFixed(2),
      productinfo: 'Vendor Registration Fee',
      name: name,
      email: email,
      phone: phoneNumber,
      surl: config.registration_success_url,
      furl: config.registration_failure_url,
      udf1: email, // Store email in UDF1
      udf2: 'registration_payment', // Store transaction type in UDF2
      udf3: '',
      udf4: '',
      udf5: '',
      udf6: '',
      udf7: '',
      udf8: '',
      udf9: '',
      udf10: ''
    };
    
    // Generate hash
    const hash = generateHash(paymentData);
    paymentData.hash = hash;
    
    // Create form data for API call
    const formData = {
      'key': config.key,
      'txnid': paymentData.txnid,
      'amount': paymentData.amount,
      'email': paymentData.email,
      'phone': paymentData.phone,
      'firstname': paymentData.name,
      'udf1': paymentData.udf1 || '',
      'udf2': paymentData.udf2 || '',
      'udf3': paymentData.udf3 || '',
      'udf4': paymentData.udf4 || '',
      'udf5': paymentData.udf5 || '',
      'hash': paymentData.hash,
      'productinfo': paymentData.productinfo,
      'udf6': paymentData.udf6 || '',
      'udf7': paymentData.udf7 || '',
      'udf8': paymentData.udf8 || '',
      'udf9': paymentData.udf9 || '',
      'udf10': paymentData.udf10 || '',
      'furl': paymentData.furl,
      'surl': paymentData.surl
    };
    
    // Store payment record in database
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      
      // First, get the vendor ID from email
      console.log('🔍 Looking up vendor with email:', email);
      const vendorResult = await client.query('SELECT id FROM vendors WHERE email = $1', [email]);
      console.log('🔍 Vendor lookup result:', {
        rowCount: vendorResult.rows.length,
        found: vendorResult.rows.length > 0,
        vendorId: vendorResult.rows.length > 0 ? vendorResult.rows[0].id : null
      });
      
      if (vendorResult.rows.length === 0) {
        console.error('❌ Vendor not found for email:', email);
        await client.query('ROLLBACK');
        return res.status(404).json({
          status: 0,
          message: 'Vendor registration not found. Please complete the registration form first. Make sure you have submitted the registration form before proceeding to payment.'
        });
      }
      
      const userId = vendorResult.rows[0].id;
      console.log('✅ Vendor found with ID:', userId);
      
      // Insert into easebuzz_payments table
      const insertQuery = `
        INSERT INTO easebuzz_payments (
          easebuzz_txn_id, user_id, amount, currency, productinfo,
          customer_name, customer_email, customer_phone, payment_status,
          success_url, failure_url, udf1, udf2, udf3, udf4, udf5,
          udf6, udf7, udf8, udf9, udf10, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        RETURNING id;
      `;
      
      const result = await client.query(insertQuery, [
        txnid, userId, registrationAmount, 'INR', paymentData.productinfo,
        name, email, phoneNumber, 'initiated',
        config.registration_success_url, config.registration_failure_url,
        paymentData.udf1, paymentData.udf2, paymentData.udf3, paymentData.udf4, paymentData.udf5,
        paymentData.udf6, paymentData.udf7, paymentData.udf8, paymentData.udf9, paymentData.udf10,
        new Date()
      ]);
      
      const paymentId = result.rows[0].id;
      
      await client.query('COMMIT');
      
      // Call Easebuzz API to initiate payment
      const paymentUrl = config.getPaymentUrl();
      const apiUrl = paymentUrl + 'payment/initiateLink';
      
      console.log('🔍 Easebuzz Registration Payment API Debug:');
      console.log('Payment URL:', paymentUrl);
      console.log('API URL:', apiUrl);
      console.log('Form Data:', formData);
      
      let apiResponse;
      try {
        apiResponse = await makeRequest(apiUrl, formData);
        console.log('🔍 Easebuzz API Response:', apiResponse);
      } catch (apiError) {
        console.error('❌ Easebuzz API Call Failed:', apiError);
        throw new Error('Failed to connect to payment gateway: ' + apiError.message);
      }
      
      if (apiResponse.status === 1 && apiResponse.data) {
        // Update payment record with access key
        await client.query(
          'UPDATE easebuzz_payments SET easebuzz_payment_id = $1, gateway_response = $2 WHERE id = $3',
          [apiResponse.data, JSON.stringify(apiResponse), paymentId]
        );
        
        await client.query('COMMIT');
        console.log('✅ Payment initiated successfully, payment ID:', paymentId);
        
        // Return payment URL or redirect
        if (config.enable_iframe === '1') {
          res.json({
            status: 1,
            data: {
              payment_url: paymentUrl + 'pay/' + apiResponse.data,
              access_key: apiResponse.data,
              iframe_mode: true
            }
          });
        } else {
          res.json({
            status: 1,
            data: {
              payment_url: paymentUrl + 'pay/' + apiResponse.data,
              redirect_url: paymentUrl + 'pay/' + apiResponse.data
            }
          });
        }
      } else {
        console.error('❌ Easebuzz API Error:', JSON.stringify(apiResponse, null, 2));
        await client.query('ROLLBACK');
        return res.status(500).json({
          status: 0,
          message: apiResponse.data || apiResponse.message || 'Failed to initiate payment with gateway'
        });
      }
      
    } catch (error) {
      console.error('❌ Database transaction error:', error);
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Error initiating registration payment:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      status: 0,
      message: 'Failed to initiate payment: ' + error.message
    });
  }
};

// Helper function to ensure transaction_id column exists
const ensureTransactionIdColumn = async (client) => {
    try {
        console.log('🔍 Checking if transaction_id column exists in vendors table...');
        
        const checkQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'vendors' AND column_name = 'transaction_id'
        `;
        
        const result = await client.query(checkQuery);
        
        if (result.rows.length === 0) {
            console.log('⚠️ transaction_id column not found, creating it...');
            await client.query('ALTER TABLE vendors ADD COLUMN transaction_id VARCHAR(255)');
            console.log('✅ transaction_id column created successfully');
        } else {
            console.log('✅ transaction_id column already exists');
        }
    } catch (error) {
        console.error('❌ Error checking/creating transaction_id column:', error.message);
        // Continue anyway - this is not critical
    }
};

// Handle registration payment success callback
exports.handleRegistrationSuccess = async (req, res) => {
  try {
    const response = req.body;
    
    console.log('🔍 Registration payment success callback received:', response);
    
    // Validate hash
    if (!validateResponseHash(response)) {
      console.error('Hash validation failed for registration success callback');
      return res.status(400).send('Hash validation failed');
    }
    
    // Update payment record and complete registration
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      
      // Get the email from UDF1
      const email = response.udf1;
      const transactionId = response.txnid;
      console.log('🔍 Processing registration for email:', email, 'txnid:', transactionId);
      
      // Update easebuzz_payments table
      await client.query(`
        UPDATE easebuzz_payments 
        SET payment_status = $1, gateway_response = $2, payment_completed_at = $3, hash_verified = $4
        WHERE easebuzz_txn_id = $5
      `, [
        response.status === 'success' ? 'success' : 'failed',
        JSON.stringify(response),
        new Date(),
        true,
        response.txnid
      ]);
      
      // If payment is successful, complete the registration
      if (response.status === 'success') {
        console.log('🔍 Payment successful, completing registration...');
        
        const vendorResult = await client.query('SELECT id FROM vendors WHERE email = $1', [email]);
        
        if (vendorResult.rows.length === 0) {
          console.error('❌ Vendor not found for email:', email);
          throw new Error('Vendor registration not found');
        }
        
        const vendorId = vendorResult.rows[0].id;
        console.log('🔍 Found vendor ID:', vendorId);
        
        // Ensure transaction_id column exists
        await ensureTransactionIdColumn(client);
        
        // Update transaction_id
        await client.query(
          'UPDATE vendors SET transaction_id = $1 WHERE id = $2',
          [transactionId, vendorId]
        );
        console.log('🔍 Updated transaction_id for vendor:', vendorId);
        
        // Create login record with AUTO-APPROVAL
        const loginQuery = `
          INSERT INTO login (user_id, email, password, role, is_approved, status) 
          VALUES ($1, $2, NULL, 'vendor', TRUE, 'active') 
          ON CONFLICT (user_id) DO UPDATE 
          SET is_approved = TRUE, status = 'active';
        `;
        await client.query(loginQuery, [vendorId, email]);
        console.log('🔍 Created login record for vendor with auto-approval:', vendorId);
        
        // Get payment amount from easebuzz_payments
        const paymentResult = await client.query(
          'SELECT amount FROM easebuzz_payments WHERE easebuzz_txn_id = $1',
          [transactionId]
        );
        
        const registrationAmount = paymentResult.rows[0]?.amount || 0;
        
        // Create transaction record in transaction table
        const transactionQuery = `
          INSERT INTO transaction (user_id, transaction_type, amount, status, description, payment_gateway, easebuzz_payment_id)
          VALUES ($1, $2, $3, $4, $5, $6, 
            (SELECT id FROM easebuzz_payments WHERE easebuzz_txn_id = $7)
          )
          RETURNING trans_id
        `;
        
        const transactionResult = await client.query(transactionQuery, [
          vendorId,
          'registration_payment',
          registrationAmount,
          'completed',
          `Vendor registration payment - ${transactionId}`,
          'easebuzz',
          transactionId
        ]);
        
        const internalTransactionId = transactionResult.rows[0].trans_id;
        console.log('🔍 Created transaction record:', internalTransactionId);
        
        // Update easebuzz_payments table with the internal_txn_id
        await client.query(`
          UPDATE easebuzz_payments 
          SET internal_txn_id = $1
          WHERE easebuzz_txn_id = $2
        `, [internalTransactionId, transactionId]);
        console.log('🔍 Updated easebuzz_payments with internal_txn_id:', internalTransactionId);
        
        console.log('✅ Registration completed successfully with auto-approval');
        
        // Send admin notification email (non-blocking)
        const { runPy } = require('../utils/emailRunner');
        try {
          await runPy('../utils/sendAdminNotificationEmail.py', [
            'New vendor registration - Auto Approved',
            `Email: ${email}\nVendorId: ${vendorId}\nTransactionId: ${transactionId}\nAmount: ₹${registrationAmount}\nStatus: Auto-approved after payment`
          ]);
          console.log('✅ Admin notification email sent');
        } catch (emailError) {
          console.error('⚠️ Admin notification email failed:', emailError);
        }
      }
      
      await client.query('COMMIT');
      
      // Redirect to success page
      res.redirect('/registration-success?txnid=' + response.txnid + '&amount=' + response.amount);
      
    } catch (error) {
      console.error('❌ Error processing registration payment:', error);
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error handling registration payment success:', error);
    res.redirect('/payment-failure?error=processing_error&returnTo=registration');
  }
};
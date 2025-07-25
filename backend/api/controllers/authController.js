// backend/api/controllers/authController.js

const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// =================================================================
// --- REGISTRATION FLOW ---
// =================================================================

exports.registerAndProceedToPayment = async (req, res) => {
  const {
    email, vendorName, phoneNumber, aadharNumber, panCardNumber,
    employeeCount, bankName, accountNumber, ifscCode, address
  } = req.body;

  if (parseInt(employeeCount, 10) < 0) {
    return res.status(400).json({ message: 'Employee count cannot be a negative number.' });
  }
  // UPGRADE: Store the full relative path for the image URL
  const passportPhotoUrl = req.file ? `/images/${req.file.filename}` : null;
  if (!email) {
    return res.status(400).json({ message: 'Email is required to register.' });
  }

  try {
    const checkExistingQuery = 'SELECT email FROM login WHERE email = $1';
    const existingLogin = await db.query(checkExistingQuery, [email]);
    if (existingLogin.rows.length > 0) {
      return res.status(409).json({ message: 'This email is already associated with a finalized account.' });
    }

    const lastIdResult = await db.query(
      "SELECT id FROM vendors WHERE id LIKE 'v_%' ORDER BY CAST(SUBSTRING(id FROM 3) AS INTEGER) DESC LIMIT 1"
    );
    let nextIdNumber = 1;
    if (lastIdResult.rows.length > 0) {
      const lastId = lastIdResult.rows[0].id;
      const lastNumber = parseInt(lastId.split('_')[1], 10);
      nextIdNumber = lastNumber + 1;
    }
    const newVendorId = `v_${String(nextIdNumber).padStart(3, '0')}`;
    
    const upsertQuery = `
      INSERT INTO vendors (
        id, email, vendor_name, phone_number, aadhar_number, pan_card_number, 
        employee_count, bank_name, account_number, ifsc_code, address, passport_photo_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (email) DO UPDATE SET 
        vendor_name = EXCLUDED.vendor_name, phone_number = EXCLUDED.phone_number,
        aadhar_number = EXCLUDED.aadhar_number, pan_card_number = EXCLUDED.pan_card_number,
        employee_count = EXCLUDED.employee_count, bank_name = EXCLUDED.bank_name,
        account_number = EXCLUDED.account_number, ifsc_code = EXCLUDED.ifsc_code,
        address = EXCLUDED.address,
        passport_photo_url = COALESCE(EXCLUDED.passport_photo_url, vendors.passport_photo_url);
    `;
    const queryParams = [
      newVendorId, email, vendorName, phoneNumber, aadharNumber, panCardNumber,
      employeeCount, bankName, accountNumber, ifscCode, address, passportPhotoUrl
    ];
    await db.query(upsertQuery, queryParams);

    console.log(`✅ Vendor details saved/updated for: ${email}`);
    res.status(200).json({ message: 'Details saved successfully. Proceed to payment.' });
  } catch (error) {
    console.error('❌ Error in registerAndProceedToPayment controller:', error);
    res.status(500).json({ message: 'An error occurred on the server while saving your details.' });
  }
};

exports.submitPaymentAndRegister = async (req, res) => {
    const { email, transactionId } = req.body;
    if (!email || !transactionId || !req.file) {
        return res.status(400).json({ message: 'Email, Transaction ID, and a screenshot are required.' });
    }
    // UPGRADE: Store the full relative path for the image URL
    const paymentScreenshotUrl = `/payments/${req.file.filename}`;
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const findVendorQuery = 'SELECT id FROM vendors WHERE email = $1';
        const vendorResult = await client.query(findVendorQuery, [email]);
        if (vendorResult.rows.length === 0) {
            throw new Error('Could not find registration data for this email. Please fill out the registration form first.');
        }
        const vendor = vendorResult.rows[0];
        const updateQuery = `UPDATE vendors SET transaction_id = $1, payment_screenshot_url = $2 WHERE id = $3`;
        await client.query(updateQuery, [transactionId, paymentScreenshotUrl, vendor.id]);
        const createLoginQuery = `INSERT INTO login (email, password, role, user_id, is_approved) VALUES ($1, NULL, 'vendor', $2, FALSE) ON CONFLICT (email) DO NOTHING;`;
        await client.query(createLoginQuery, [email, vendor.id]);
        await client.query('COMMIT');
        res.status(201).json({ message: 'Registration complete! Your account is now pending administrator approval.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error in submitPaymentAndRegister controller:', error.message);
        res.status(500).json({ message: error.message || 'An internal server error occurred.' });
    } finally {
        client.release();
    }
};

// =================================================================
// --- LOGIN FLOW ---
// =================================================================

exports.checkUserStatus = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });
    try {
        const { rows } = await db.query('SELECT * FROM login WHERE email = $1', [email]);
        if (rows.length === 0) { return res.status(200).json({ status: 'notFound', message: 'No account found with this email.' }); }
        const user = rows[0];
        if (!user.is_approved) { return res.status(200).json({ status: 'pending', message: 'Your account is pending administrator approval.' }); }
        if (user.password === null) { return res.status(200).json({ status: 'setPassword', message: 'Account approved! Please set your password.' }); }
        return res.status(200).json({ status: 'approved', message: 'Please enter your password.' });
    } catch (error) { console.error('❌ Error in checkUserStatus:', error); res.status(500).json({ message: 'Server error while checking email status.' }); }
};

exports.setPasswordAndLogin = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const updateQuery = 'UPDATE login SET password = $1 WHERE email = $2 RETURNING *';
        const { rows } = await db.query(updateQuery, [hashedPassword, email]);
        if (rows.length === 0) return res.status(404).json({ message: 'User not found.' });
        const user = rows[0];
        const payload = { userId: user.user_id, email: user.email, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
        const userForClient = { id: user.user_id, email: user.email, role: user.role };
        res.status(200).json({ message: 'Password set successfully! Logging you in...', token, user: userForClient });
    } catch (error) { console.error('❌ Error in setPasswordAndLogin:', error); res.status(500).json({ message: 'Server error.' }); }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
    try {
        const { rows } = await db.query('SELECT * FROM login WHERE email = $1', [email]);
        if (rows.length === 0) return res.status(401).json({ message: 'Invalid credentials.' });
        const user = rows[0];
        if (user.password === null) { return res.status(400).json({ message: 'Account exists but password is not set. Please restart the login process.' }); }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) { return res.status(401).json({ message: 'Invalid credentials.' }); }
        const payload = { userId: user.user_id, email: user.email, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
        const userForClient = { id: user.user_id, email: user.email, role: user.role };
        res.status(200).json({ message: 'Login successful!', token, user: userForClient });
    } catch (error) { console.error('❌ Error during login:', error); res.status(500).json({ message: 'Server error during login.' }); }
};
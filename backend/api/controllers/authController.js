const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// =================================================================
// --- HELPER FUNCTIONS ---
// =================================================================

/**
 * Generates the next sequential vendor ID (e.g., v_001, v_002).
 * MUST be called within a transaction that has locked the 'vendors' table.
 */
const getNextVendorId = async (client) => {
    const query = "SELECT id FROM vendors WHERE id LIKE 'v_%' ORDER BY CAST(SUBSTRING(id FROM 3) AS INTEGER) DESC LIMIT 1";
    const { rows } = await client.query(query);
    if (rows.length === 0) return 'v_001';
    const lastNumber = parseInt(rows[0].id.split('_')[1], 10);
    return `v_${String(lastNumber + 1).padStart(3, '0')}`;
};

/**
 * Creates a JWT for a given user.
 */
const generateToken = (user) => {
    const payload = {
        // Use user_id from the 'login' table as the primary identifier for consistency
        userId: user.user_id,
        email: user.email,
        role: user.role
    };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
};

// =================================================================
// --- REGISTRATION FLOW ---
// =================================================================

/**
 * Step 1 of Registration: Saves/Updates a vendor's details before payment.
 * This process is fully transactional and safe from race conditions.
 */
exports.registerAndProceedToPayment = async (req, res) => {
    const {
        email, vendorName, phoneNumber, aadharNumber, panCardNumber,
        employeeCount, bankName, accountNumber, ifscCode, address
    } = req.body;
    const passportPhotoFile = req.file;

    if (!email || !vendorName || !passportPhotoFile) {
        return res.status(400).json({ message: 'Email, Vendor Name, and Passport Photo are required.' });
    }
    if (parseInt(employeeCount, 10) < 0) {
        return res.status(400).json({ message: 'Employee count cannot be negative.' });
    }

    const passportPhotoUrl = `/images/${passportPhotoFile.filename}`;
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // Check if a finalized account already exists in the 'login' table. If so, block changes.
        const existingLogin = await client.query('SELECT 1 FROM login WHERE email = $1', [email]);
        if (existingLogin.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: 'An active account with this email already exists and cannot be modified.' });
        }
        
        // Use SELECT...FOR UPDATE to lock the row if it exists, preventing concurrent updates.
        const existingVendorRes = await client.query('SELECT id FROM vendors WHERE email = $1 FOR UPDATE', [email]);
        const existingVendor = existingVendorRes.rows[0];

        if (existingVendor) {
            // If vendor exists (but not in login table), UPDATE their details
            const updateQuery = `
                UPDATE vendors SET 
                    vendor_name = $1, phone_number = $2, aadhar_number = $3, pan_card_number = $4, 
                    employee_count = $5, bank_name = $6, account_number = $7, ifsc_code = $8, 
                    address = $9, passport_photo_url = $10, updated_at = NOW()
                WHERE id = $11;
            `;
            await client.query(updateQuery, [
                vendorName, phoneNumber, aadharNumber, panCardNumber, employeeCount,
                bankName, accountNumber, ifscCode, address, passportPhotoUrl, existingVendor.id
            ]);
        } else {
            // If it's a new vendor, INSERT their details
            await client.query('LOCK TABLE vendors IN EXCLUSIVE MODE'); // Lock for safe ID generation
            const newVendorId = await getNextVendorId(client);
            const insertQuery = `
                INSERT INTO vendors (id, email, vendor_name, phone_number, aadhar_number, pan_card_number, employee_count, bank_name, account_number, ifsc_code, address, passport_photo_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);
            `;
            await client.query(insertQuery, [
                newVendorId, email, vendorName, phoneNumber, aadharNumber, panCardNumber,
                employeeCount, bankName, accountNumber, ifscCode, address, passportPhotoUrl
            ]);
        }
        
        await client.query('COMMIT');
        res.status(200).json({ message: 'Details saved successfully. Please proceed to payment.' });
    } catch (error) {
        await client.query('ROLLBACK');
        
        // Provide specific feedback for unique constraint violations
        if (error.code === '23505') {
            let userMessage = 'A record with one of these unique details already exists.';
            if (error.constraint === 'vendors_pan_card_number_key') userMessage = 'This PAN card is already registered.';
            if (error.constraint === 'vendors_aadhar_number_key') userMessage = 'This Aadhar number is already registered.';
            if (error.constraint === 'vendors_account_number_key') userMessage = 'This bank account number is already registered.';
            return res.status(409).json({ message: userMessage });
        }

        console.error('❌ Error in registerAndProceedToPayment:', error);
        res.status(500).json({ message: 'An unexpected server error occurred.' });
    } finally {
        client.release();
    }
};

/**
 * Step 2 of Registration: Submits payment proof and creates a pending 'login' entry.
 */

exports.submitPaymentAndRegister = async (req, res) => {
    const { email, transactionId } = req.body;
    const paymentScreenshotFile = req.file;

    if (!email || !transactionId || !paymentScreenshotFile) {
        return res.status(400).json({ message: 'Email, Transaction ID, and a payment screenshot are required.' });
    }
    const paymentScreenshotUrl = `/payments/${paymentScreenshotFile.filename}`;
    const client = await db.connect();

    try {
        await client.query('BEGIN');
        
        const vendorResult = await client.query('SELECT id FROM vendors WHERE email = $1', [email]);
        if (vendorResult.rows.length === 0) {
            throw new Error('Registration data not found. Please complete the first step of the form.');
        }
        const vendorId = vendorResult.rows[0].id;
        
        // Update vendor record with payment proof
        await client.query(
            'UPDATE vendors SET transaction_id = $1, payment_screenshot_url = $2 WHERE id = $3',
            [transactionId, paymentScreenshotUrl, vendorId]
        );
        
        // --- THIS IS THE FIX ---
        // The INSERT statement now matches your database schema exactly.
        // It inserts into the columns: user_id, email, password, role, is_approved, status
        const loginQuery = `
            INSERT INTO login (user_id, email, password, role, is_approved, status) 
            VALUES ($1, $2, NULL, 'vendor', FALSE, 'pending_approval') 
            ON CONFLICT (user_id) DO NOTHING;
        `;
        // We use the vendorId from the vendors table as the user_id in the login table.
        await client.query(loginQuery, [vendorId, email]);

        await client.query('COMMIT');
        res.status(201).json({ message: 'Registration complete! Your account is now pending administrator approval.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error in submitPaymentAndRegister:', error);
        res.status(500).json({ message: error.message || 'An internal server error occurred.' });
    } finally {
        client.release();
    }
};

// =================================================================
// --- LOGIN & STATUS FLOW ---
// =================================================================

/**
 * Checks the status of a user's account to determine the next login step.
 */
exports.checkUserStatus = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    try {
        const { rows } = await db.query('SELECT * FROM login WHERE email = $1', [email]);
        if (rows.length === 0) {
            // This is not an error, it's a valid state for a new user.
            return res.status(200).json({ status: 'notFound', message: 'No account found with this email. Please register.' });
        }
        const user = rows[0];
        if (!user.is_approved) {
            return res.status(200).json({ status: 'pending', message: 'Your account is pending administrator approval.' });
        }
        if (user.password === null) {
            return res.status(200).json({ status: 'setPassword', message: 'Account approved! Please set your password to continue.' });
        }
        return res.status(200).json({ status: 'approved', message: 'Account found. Please enter your password.' });
    } catch (error) {
        console.error('❌ Error in checkUserStatus:', error);
        res.status(500).json({ message: 'Server error while checking email status.' });
    }
};

/**
 * Sets a user's password for the first time and logs them in.
 */
exports.setPasswordAndLogin = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Ensure we only set the password if the user is approved and the password is not already set.
        const updateQuery = 'UPDATE login SET password = $1 WHERE email = $2 AND is_approved = TRUE AND password IS NULL RETURNING *';
        const { rows } = await db.query(updateQuery, [hashedPassword, email]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Could not set password. User may not be approved or a password already exists.' });
        }
        
        const user = rows[0];
        const token = generateToken(user);
        const userForClient = { id: user.user_id, email: user.email, role: user.role };
        
        res.status(200).json({ message: 'Password set successfully! Logging you in...', token, user: userForClient });
    } catch (error) {
        console.error('❌ Error in setPasswordAndLogin:', error);
        res.status(500).json({ message: 'Server error while setting password.' });
    }
};

/**
 * Logs in an existing user with an email and password.
 */
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    try {
        const { rows } = await db.query('SELECT * FROM login WHERE email = $1', [email]);
        if (rows.length === 0) return res.status(401).json({ message: 'Invalid credentials.' });

        const user = rows[0];
        // Security Check: Do not let unapproved users or users without a password attempt a password-based login.
        if (!user.is_approved || user.password === null) {
            return res.status(401).json({ message: 'This account is not active or not ready for password login.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' });

        const token = generateToken(user);
        const userForClient = { id: user.user_id, email: user.email, role: user.role };

        res.status(200).json({ message: 'Login successful!', token, user: userForClient });
    } catch (error) {
        console.error('❌ Error during login:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { uploadFileToR2 } = require('../utils/cloudflareR2');

// =================================================================
// --- HELPER FUNCTIONS (Unchanged) ---
// =================================================================
const getNextVendorId = async (client) => {
    const query = "SELECT id FROM vendors WHERE id LIKE 'v_%' ORDER BY CAST(SUBSTRING(id FROM 3) AS INTEGER) DESC LIMIT 1";
    const { rows } = await client.query(query);
    if (rows.length === 0) return 'v_001';
    const lastNumber = parseInt(rows[0].id.split('_')[1], 10);
    return `v_${String(lastNumber + 1).padStart(3, '0')}`;
};

const generateToken = (user) => {
    const payload = { userId: user.user_id, email: user.email, role: user.role };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
};

const getNextFileSequence = async (client, column, table, prefix) => {
    const query = `
        SELECT ${column} FROM ${table}
        WHERE ${column} LIKE '%/${prefix}%'
        ORDER BY CAST(substring(${column} from '/${prefix}(\\d+)') AS INTEGER) DESC
        LIMIT 1;
    `;
    try {
        const { rows } = await client.query(query);
        if (rows.length === 0) return 1;
        const lastUrl = rows[0][column];
        const match = lastUrl.match(new RegExp(`${prefix}(\\d+)`));
        if (match && match[1]) {
            const lastNumber = parseInt(match[1], 10);
            return lastNumber + 1;
        }
        return 1;
    } catch {
        return 1;
    }
};


// =================================================================
// --- REGISTRATION FLOW ---
// =================================================================

/**
 * --- UPDATED ---
 * Step 1 of Registration: Saves/Updates vendor details (without employeeCount).
 */

/**
 * --- UPDATED ---
 * Step 1 of Registration: Saves/Updates vendor details and handles referral logic.
 */
exports.registerAndProceedToPayment = async (req, res) => {
    // 1. Destructure the new 'referralId' field from the request body
    const {
        email, vendorName, phoneNumber, aadharNumber, panCardNumber,
        bankName, accountNumber, ifscCode, address, referralId
    } = req.body;
    const passportPhotoFile = req.file;

    if (!email || !vendorName || !passportPhotoFile) {
        return res.status(400).json({ message: 'Email, Vendor Name, and Passport Photo are required.' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 2. Validate the referral ID if it was provided
        if (referralId && referralId.trim() !== '') {
            const referrerResult = await client.query('SELECT 1 FROM vendors WHERE id = $1', [referralId.trim()]);
            if (referrerResult.rows.length === 0) {
                throw new Error('The provided Referral ID is not valid.');
            }
        }

        const existingLogin = await client.query('SELECT 1 FROM login WHERE email = $1', [email]);
        if (existingLogin.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: 'An active account with this email already exists and cannot be modified.' });
        }

        const nextPPNum = await getNextFileSequence(client, 'passport_photo_url', 'vendors', 'PP_');
        const passportPhotoFilename = `PP_${String(nextPPNum).padStart(3, '0')}${path.extname(passportPhotoFile.originalname)}`;
        const passportPhotoUrl = await uploadFileToR2(passportPhotoFile, 'passport_photos', passportPhotoFilename);

        const existingVendorRes = await client.query('SELECT id FROM vendors WHERE email = $1 FOR UPDATE', [email]);
        let vendorId; // Variable to hold the new or existing vendor's ID

        if (existingVendorRes.rows.length > 0) {
            // UPDATE existing pre-registered vendor
            vendorId = existingVendorRes.rows[0].id;
            const updateQuery = `
                UPDATE vendors SET 
                    vendor_name = $1, phone_number = $2, aadhar_number = $3, pan_card_number = $4, 
                    bank_name = $5, account_number = $6, ifsc_code = $7, 
                    address = $8, passport_photo_url = $9, updated_at = NOW()
                WHERE id = $10;
            `;
            await client.query(updateQuery, [
                vendorName, phoneNumber, aadharNumber, panCardNumber,
                bankName, accountNumber, ifscCode, address, passportPhotoUrl, vendorId
            ]);
        } else {
            // INSERT a new vendor
            await client.query('LOCK TABLE vendors IN EXCLUSIVE MODE');
            vendorId = await getNextVendorId(client); // Get the new vendor's ID
            const insertQuery = `
                INSERT INTO vendors (id, email, vendor_name, phone_number, aadhar_number, pan_card_number, bank_name, account_number, ifsc_code, address, passport_photo_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
            `;
            await client.query(insertQuery, [
                vendorId, email, vendorName, phoneNumber, aadharNumber, panCardNumber,
                bankName, accountNumber, ifscCode, address, passportPhotoUrl
            ]);
        }

        // 3. If a valid referralId was provided, append the new vendor's ID to the referrer's list
        if (referralId && referralId.trim() !== '') {
            await client.query(
                // COALESCE handles the case where the list is initially NULL
                'UPDATE vendors SET referral_id_list = array_append(COALESCE(referral_id_list, ARRAY[]::TEXT[]), $1) WHERE id = $2',
                [vendorId, referralId.trim()]
            );
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Details saved successfully. Please proceed to payment.' });
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') {
            let userMessage = 'A record with one of these unique details already exists.';
            if (error.constraint === 'vendors_pan_card_number_key') userMessage = 'This PAN card is already registered.';
            if (error.constraint === 'vendors_aadhar_number_key') userMessage = 'This Aadhar number is already registered.';
            if (error.constraint === 'vendors_account_number_key') userMessage = 'This bank account number is already registered.';
            return res.status(409).json({ message: userMessage });
        }
        console.error('❌ Error in registerAndProceedToPayment:', error);
        // Pass the specific error message (like "Invalid Referral ID") to the frontend
        res.status(500).json({ message: error.message || 'An unexpected server error occurred.' });
    } finally {
        client.release();
    }
};

/**
 * Step 2 of Registration: Submits payment proof. (No changes needed here)
 */
exports.submitPaymentAndRegister = async (req, res) => {
    // This function is already correct and does not handle employeeCount, so no changes are needed.
    const { email, transactionId } = req.body;
    const paymentScreenshotFile = req.file;

    if (!email || !transactionId || !paymentScreenshotFile) {
        return res.status(400).json({ message: 'Email, Transaction ID, and a payment screenshot are required.' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const vendorResult = await client.query('SELECT id FROM vendors WHERE email = $1', [email]);
        if (vendorResult.rows.length === 0) {
            throw new Error('Registration data not found. Please complete the first step of the form.');
        }
        const vendorId = vendorResult.rows[0].id;
        const nextPSNum = await getNextFileSequence(client, 'payment_screenshot_url', 'vendors', 'PS_');
        const screenshotFilename = `PS_${String(nextPSNum).padStart(3, '0')}${path.extname(paymentScreenshotFile.originalname)}`;
        const paymentScreenshotUrl = await uploadFileToR2(paymentScreenshotFile, 'payment_screenshots', screenshotFilename);
        await client.query(
            'UPDATE vendors SET transaction_id = $1, payment_screenshot_url = $2 WHERE id = $3',
            [transactionId, paymentScreenshotUrl, vendorId]
        );
        const loginQuery = `
            INSERT INTO login (user_id, email, password, role, is_approved, status) 
            VALUES ($1, $2, NULL, 'vendor', FALSE, 'pending_approval') 
            ON CONFLICT (user_id) DO NOTHING;
        `;
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
// --- LOGIN & STATUS FLOW (No Changes Needed Here) ---
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
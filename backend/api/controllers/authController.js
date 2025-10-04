const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { uploadFileToR2 } = require('../utils/cloudflareR2');
const { runPy } = require('../utils/emailRunner');

// =================================================================
// --- HELPER FUNCTIONS (Unchanged) ---
// =================================================================

/**
 * Check if transaction_id column exists in vendors table, create if not
 */
const ensureTransactionIdColumn = async (client) => {
    try {
        console.log('🔍 Checking if transaction_id column exists in vendors table...');
        
        // Check if transaction_id column exists
        const checkQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'vendors' AND column_name = 'transaction_id'
        `;
        console.log('🔍 Executing check query:', checkQuery);
        
        const result = await client.query(checkQuery);
        console.log('🔍 Check query result:', result.rows);
        
        if (result.rows.length === 0) {
            console.log('⚠️ transaction_id column not found, creating it...');
            // Add the transaction_id column
            const alterQuery = 'ALTER TABLE vendors ADD COLUMN transaction_id VARCHAR(255)';
            console.log('🔍 Executing alter query:', alterQuery);
            
            await client.query(alterQuery);
            console.log('✅ transaction_id column created successfully');
        } else {
            console.log('✅ transaction_id column already exists');
        }
    } catch (error) {
        console.error('❌ Error checking/creating transaction_id column:', error.message);
        console.error('❌ Full error:', error);
        // Continue anyway - this is not critical
    }
};

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
    } catch (error) {
        console.warn(`Could not determine next file sequence for prefix ${prefix}. Defaulting to 1.`, error?.message);
        return 1;
    }
};


exports.registerAndProceedToPayment = async (req, res) => {
    // No change here - destructuring is the same
    const {
        email, vendorName, phoneNumber, aadharNumber, panCardNumber,
        bankName, accountNumber, ifscCode, address, referralId // referralId is the ID of the person who referred them
    } = req.body;
    const passportPhotoFile = req.file;

    if (!email || !vendorName) {
        return res.status(400).json({ message: 'Email and Vendor Name are required.' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // This validation logic is already correct and remains unchanged.
        const trimmedReferralId = referralId ? referralId.trim() : null;
        if (trimmedReferralId) {
            const referrerResult = await client.query('SELECT 1 FROM vendors WHERE id = $1', [trimmedReferralId]);
            if (referrerResult.rows.length === 0) {
                throw new Error('The provided Referral ID is not valid.');
            }
        }

        const existingLogin = await client.query('SELECT 1 FROM login WHERE email = $1', [email]);
        if (existingLogin.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: 'An active account with this email already exists and cannot be modified.' });
        }

        let passportPhotoUrl = null;
        if (passportPhotoFile) {
            const nextPPNum = await getNextFileSequence(client, 'passport_photo_url', 'vendors', 'PP_');
            const passportPhotoFilename = `PP_${String(nextPPNum).padStart(3, '0')}${path.extname(passportPhotoFile.originalname)}`;
            passportPhotoUrl = await uploadFileToR2(passportPhotoFile, 'passport_photos', passportPhotoFilename);
        }

        const existingVendorRes = await client.query('SELECT id FROM vendors WHERE email = $1 FOR UPDATE', [email]);
        let vendorId;

        if (existingVendorRes.rows.length > 0) {
            // --- CHANGE #1: UPDATE query now includes the 'referred_id' ---
            // This handles cases where a pre-registered user completes registration with a referral code.
            vendorId = existingVendorRes.rows[0].id;
            const updateQuery = `
                UPDATE vendors SET 
                    vendor_name = $1, phone_number = $2, aadhar_number = $3, pan_card_number = $4, 
                    bank_name = $5, account_number = $6, ifsc_code = $7, address = $8, 
                    passport_photo_url = COALESCE($9, passport_photo_url), referred_id = $10, updated_at = NOW()
                WHERE id = $11;
            `;
            await client.query(updateQuery, [
                vendorName, phoneNumber, aadharNumber || null, panCardNumber,
                bankName, accountNumber, ifscCode, address, passportPhotoUrl, 
                trimmedReferralId, // <-- The new value to set
                vendorId
            ]);
        } else {
            // --- CHANGE #2: INSERT query now includes the 'referred_id' column and value ---
            await client.query('LOCK TABLE vendors IN EXCLUSIVE MODE');
            vendorId = await getNextVendorId(client);
            const insertQuery = `
                INSERT INTO vendors (
                    id, email, vendor_name, phone_number, aadhar_number, 
                    pan_card_number, bank_name, account_number, ifsc_code, 
                    address, passport_photo_url, referred_id
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);
            `;
            await client.query(insertQuery, [
                vendorId, email, vendorName, phoneNumber, aadharNumber || null, 
                panCardNumber, bankName, accountNumber, ifscCode, address, 
                passportPhotoUrl, trimmedReferralId // <-- The new value to insert
            ]);
        }

        // This logic is for the REFERRER and is still correct. No change needed here.
        if (trimmedReferralId) {
            await client.query(
                'UPDATE vendors SET referral_id_list = array_append(COALESCE(referral_id_list, ARRAY[]::TEXT[]), $1) WHERE id = $2',
                [vendorId, trimmedReferralId]
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
        res.status(500).json({ message: error.message || 'An unexpected server error occurred.' });
    } finally {
        client.release();
    }
};

exports.submitPaymentAndRegister = async (req, res) => {
    console.log('🚀 submitPaymentAndRegister called with body:', req.body);
    console.log('🚀 Request headers:', req.headers);
    
    let client; // Declare client variable in function scope
    
    try {
        // --- MODIFIED: No longer expecting req.file ---
        const { email, transactionId } = req.body;

        // --- MODIFIED: Validation updated ---
        if (!email || !transactionId) {
            console.log('❌ Validation failed: email or transactionId missing');
            console.log('❌ Email:', email, 'TransactionId:', transactionId);
            return res.status(400).json({ message: 'Email and Transaction ID are required.' });
        }

        console.log('✅ Validation passed, connecting to database...');
        
        // Test database connection first
        try {
            client = await db.connect();
            console.log('✅ Database connection successful');
        } catch (dbConnError) {
            console.error('❌ Database connection failed:', dbConnError);
            console.error('❌ Full connection error:', {
                message: dbConnError.message,
                stack: dbConnError.stack,
                name: dbConnError.name
            });
            return res.status(500).json({ 
                message: 'Database connection failed', 
                error: dbConnError.message 
            });
        }
        
        try {
            console.log('🔍 Starting database transaction...');
            await client.query('BEGIN');
            console.log('✅ Database transaction started');
            
            console.log('🔍 Looking up vendor by email:', email);
            let vendorResult;
            try {
                vendorResult = await client.query('SELECT id FROM vendors WHERE email = $1', [email]);
                console.log('🔍 Vendor lookup result:', vendorResult.rows);
            } catch (vendorLookupError) {
                console.error('❌ Vendor lookup failed:', vendorLookupError);
                throw new Error(`Vendor lookup failed: ${vendorLookupError.message}`);
            }
            
            if (vendorResult.rows.length === 0) {
                throw new Error('Registration data not found. Please complete the first step of the form.');
            }
            const vendorId = vendorResult.rows[0].id;
            console.log('✅ Found vendor with ID:', vendorId);

            // Ensure transaction_id column exists
            console.log('🔍 Ensuring transaction_id column exists...');
            try {
                await ensureTransactionIdColumn(client);
                console.log('✅ Column check/creation completed');
            } catch (columnError) {
                console.error('❌ Column check/creation failed:', columnError);
                console.error('❌ Column error details:', {
                    message: columnError.message,
                    stack: columnError.stack,
                    name: columnError.name
                });
                // Continue anyway - this is not critical
            }

            // Update the transaction_id
            console.log('🔍 Updating transaction_id to:', transactionId);
            try {
                await client.query(
                    'UPDATE vendors SET transaction_id = $1 WHERE id = $2',
                    [transactionId, vendorId]
                );
                console.log('✅ Transaction ID updated successfully');
            } catch (dbError) {
                console.error('⚠️ Error updating transaction_id:', dbError.message);
                console.error('⚠️ Transaction update error details:', {
                    message: dbError.message,
                    stack: dbError.stack,
                    name: dbError.name,
                    code: dbError.code
                });
                // Continue with registration even if this fails
            }

            // This part remains the same
            console.log('🔍 Creating login record...');
            const loginQuery = `
                INSERT INTO login (user_id, email, password, role, is_approved, status) 
                VALUES ($1, $2, NULL, 'vendor', FALSE, 'pending_approval') 
                ON CONFLICT (user_id) DO NOTHING;
            `;
            try {
                await client.query(loginQuery, [vendorId, email]);
                console.log('✅ Login record created successfully');
            } catch (loginError) {
                console.error('❌ Login record creation failed:', loginError);
                throw new Error(`Login creation failed: ${loginError.message}`);
            }
            
            console.log('🔍 Committing transaction...');
            try {
                await client.query('COMMIT');
                console.log('✅ Database transaction committed successfully');
            } catch (commitError) {
                console.error('❌ Transaction commit failed:', commitError);
                throw new Error(`Transaction commit failed: ${commitError.message}`);
            }

            // Send admin notification email (non-blocking - don't fail registration if email fails)
            console.log('🔍 Attempting to send admin notification email...');
            try {
                const emailResult = await runPy('../utils/sendAdminNotificationEmail.py', [
                    'New registration pending approval',
                    `Email: ${email}\nVendorId: ${vendorId}\nTransactionId: ${transactionId}`
                ]);
                console.log('✅ Admin notification email sent successfully');
                console.log('✅ Email result:', emailResult);
            } catch (emailError) {
                console.error('⚠️ Admin notification email failed (but registration succeeded):', emailError?.message || emailError);
                console.error('⚠️ Email error details:', {
                    message: emailError?.message,
                    stack: emailError?.stack,
                    name: emailError?.name,
                    code: emailError?.code
                });
                // Log the registration manually since email failed
                console.log('📝 MANUAL LOG: New vendor registration:', {
                    email: email,
                    vendorId: vendorId,
                    transactionId: transactionId,
                    timestamp: new Date().toISOString()
                });
            }

            console.log('🎉 Registration completed successfully, sending response...');
            res.status(201).json({ message: 'Registration complete! Your account is now pending administrator approval.' });
            
        } catch (transactionError) {
            console.error('❌ Transaction error in submitPaymentAndRegister:', transactionError);
            console.error('❌ Transaction error details:', {
                message: transactionError.message,
                stack: transactionError.stack,
                name: transactionError.name,
                code: transactionError.code
            });
            
            try {
                await client.query('ROLLBACK');
                console.log('✅ Transaction rolled back successfully');
            } catch (rollbackError) {
                console.error('❌ Rollback failed:', rollbackError);
            }
            
            throw transactionError; // Re-throw to be caught by outer catch
        }
        
    } catch (error) {
        console.error('❌ CRITICAL ERROR in submitPaymentAndRegister:', error);
        console.error('❌ FULL ERROR DETAILS:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code,
            cause: error.cause
        });
        
        // Send detailed error response
        res.status(500).json({ 
            message: 'Registration failed due to server error',
            error: error.message,
            errorType: error.name,
            timestamp: new Date().toISOString()
        });
    } finally {
        if (client) {
            try {
                client.release();
                console.log('🔒 Database client released successfully');
            } catch (releaseError) {
                console.error('❌ Error releasing database client:', releaseError);
            }
        }
    }
};


const isEmail = (value) => /\S+@\S+\.\S+/.test(value);


exports.checkUserStatus = async (req, res) => {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ message: 'Email or phone number is required.' });

    try {
        let query, params;
        if (isEmail(identifier)) {
            query = 'SELECT * FROM login WHERE email = $1';
            params = [identifier];
        } else {
            // Support phone number lookup for ALL roles (admin, vendor, coordinator, employee)
            query = `
                SELECT l.* FROM login l
                WHERE l.user_id IN (
                    SELECT id FROM vendors WHERE phone_number = $1 
                    UNION
                    SELECT coordinator_id FROM coordinator WHERE phone_number = $1
                )
            `;
            params = [identifier];
        }

        const { rows } = await db.query(query, params);
        if (rows.length === 0) {
            return res.status(200).json({ status: 'notFound', message: 'No account found. Please register.' });
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
        res.status(500).json({ message: 'Server error while checking account status.' });
    }
};

/**
 * Sets a user's password for the first time and logs them in.
 * Supports email OR phone number.
 */
exports.setPasswordAndLogin = async (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) return res.status(400).json({ message: 'Email/phone and password are required.' });

    try {
        let query, params;
        if (isEmail(identifier)) {
            query = 'SELECT * FROM login WHERE email = $1 AND is_approved = TRUE AND password IS NULL';
            params = [identifier];
        } else {
            // Support phone number lookup for ALL roles (admin, vendor, coordinator, employee)
            query = `
                SELECT l.* FROM login l
                WHERE l.user_id IN (
                    SELECT id FROM vendors WHERE phone_number = $1
                    UNION
                    SELECT coordinator_id FROM coordinator WHERE phone_number = $1
                )
                AND l.is_approved = TRUE AND l.password IS NULL
            `;
            params = [identifier];
        }

        const { rows } = await db.query(query, params);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Could not set password. User may not be approved or already has a password.' });
        }

        const user = rows[0];
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update password
        await db.query('UPDATE login SET password = $1 WHERE user_id = $2', [hashedPassword, user.user_id]);

        const token = generateToken(user);
        const userForClient = { id: user.user_id, email: user.email, role: user.role };

        res.status(200).json({ message: 'Password set successfully! Logging you in...', token, user: userForClient });
    } catch (error) {
        console.error('❌ Error in setPasswordAndLogin:', error);
        res.status(500).json({ message: 'Server error while setting password.' });
    }
};

/**
 * Logs in an existing user with email/phone and password.
 */
exports.loginUser = async (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) return res.status(400).json({ message: 'Email/phone and password are required.' });

    try {
        let query, params;
        if (isEmail(identifier)) {
            query = 'SELECT * FROM login WHERE email = $1';
            params = [identifier];
        } else {
            // Support phone number login for ALL roles (admin, vendor, coordinator, employee)
            query = `
                SELECT l.* FROM login l
                WHERE l.user_id IN (
                    SELECT id FROM vendors WHERE phone_number = $1
                    UNION
                    SELECT coordinator_id FROM coordinator WHERE phone_number = $1
                )
            `;
            params = [identifier];
        }

        const { rows } = await db.query(query, params);
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

/**
 * Test endpoint to verify database connectivity
 */
exports.testDatabase = async (req, res) => {
    try {
        console.log('🧪 Testing database connectivity...');
        
        const client = await db.connect();
        console.log('✅ Database connection successful');
        
        // Test basic query
        const result = await client.query('SELECT NOW() as current_time');
        console.log('✅ Basic query successful:', result.rows[0]);
        
        // Test vendors table
        const vendorCount = await client.query('SELECT COUNT(*) as count FROM vendors');
        console.log('✅ Vendors table query successful:', vendorCount.rows[0]);
        
        // Test transaction table
        const transactionCount = await client.query('SELECT COUNT(*) as count FROM transaction');
        console.log('✅ Transaction table query successful:', transactionCount.rows[0]);
        
        client.release();
        
        res.status(200).json({
            success: true,
            message: 'Database connectivity test successful',
            data: {
                current_time: result.rows[0].current_time,
                vendors_count: vendorCount.rows[0].count,
                transactions_count: transactionCount.rows[0].count
            }
        });
        
    } catch (error) {
        console.error('❌ Database test failed:', error);
        res.status(500).json({
            success: false,
            message: 'Database test failed',
            error: error.message
        });
    }
};


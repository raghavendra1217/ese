const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { execFile } = require('child_process');
const path = require('path');

// Helper: Generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ==============================
// Request OTP
// ==============================
exports.requestOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const client = await db.connect();
    try {
        const userResult = await client.query('SELECT * FROM login WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'No account found with this email.' });
        }

        const otp = generateOTP();
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        // Save OTP and expiry to DB
        await client.query(
            'UPDATE login SET otp = $1, otp_expiry = $2 WHERE email = $3',
            [otp, expiry, email]
        );

        // Send OTP via Python script
        const scriptPath = path.resolve(__dirname, '../utils/send_otp_email.py');
        const subprocess = execFile(
            'python',
            [scriptPath, email, otp],
            {
                env: {
                    ...process.env,
                    GMAIL_USER: process.env.GMAIL_USER,
                    GMAIL_APP_PASS: process.env.GMAIL_APP_PASS,
                }
            },
            (error, stdout, stderr) => {
                if (error) {
                    console.error('OTP Email Error:', stderr || error.message);
                    return res.status(500).json({ message: 'Failed to send OTP email.' });
                }
                console.log(stdout);
                return res.status(200).json({ message: 'OTP sent to your email.' });
            }
        );
    } catch (err) {
        console.error('❌ Error in requestOtp:', err);
        res.status(500).json({ message: 'Server error while generating OTP.' });
    } finally {
        client.release();
    }
};

// ==============================
// Verify OTP
// ==============================
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });

    try {
        const { rows } = await db.query('SELECT otp, otp_expiry FROM login WHERE email = $1', [email]);
        if (rows.length === 0) return res.status(404).json({ message: 'No such user.' });

        const { otp: storedOtp, otp_expiry } = rows[0];
        if (storedOtp !== otp) return res.status(401).json({ message: 'Invalid OTP.' });

        if (new Date(otp_expiry) < new Date()) {
            return res.status(410).json({ message: 'OTP has expired.' });
        }

        await db.query('UPDATE login SET password = NULL WHERE email = $1', [email]);
        res.status(200).json({ message: 'OTP verified. You can now reset your password.' });
    } catch (err) {
        console.error('❌ Error in verifyOtp:', err);
        res.status(500).json({ message: 'Server error while verifying OTP.' });
    }
};

// ==============================
// Reset Password
// ==============================
exports.resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ message: 'Email and new password are required.' });

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const result = await db.query(
            'UPDATE login SET password = $1, otp = NULL, otp_expiry = NULL WHERE email = $2 AND password IS NULL RETURNING *',
            [hashedPassword, email]
        );

        if (result.rowCount === 0) {
            return res.status(400).json({ message: 'Password already set or invalid OTP verification state.' });
        }

        res.status(200).json({ message: 'Password reset successful! You can now log in.' });
    } catch (err) {
        console.error('❌ Error in resetPassword:', err);
        res.status(500).json({ message: 'Server error during password reset.' });
    }
};

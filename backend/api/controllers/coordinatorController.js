const db = require('../config/database');
const bcrypt = require('bcrypt');

/**
 * Ensure disbursement tables exist
 */
const ensureDisbursementTables = async (client) => {
    try {
        console.log('🔍 Checking if disbursement tables exist...');

        // Check if disbursement_schedules table exists
        const schedulesCheck = await client.query(`
            SELECT table_name FROM information_schema.tables
            WHERE table_name = 'disbursement_schedules'
        `);

        if (schedulesCheck.rows.length === 0) {
            console.log('⚠️ disbursement_schedules table not found, creating it...');

            // Create disbursement_schedules table
            await client.query(`
                CREATE TABLE disbursement_schedules (
                    id BIGSERIAL PRIMARY KEY,
                    investor_id BIGINT NOT NULL,
                    investment_amount DECIMAL(15,2) NOT NULL,
                    total_return DECIMAL(15,2) NOT NULL,
                    duration_days INTEGER NOT NULL,
                    interval_days INTEGER NOT NULL,
                    num_disbursements INTEGER NOT NULL,
                    disbursement_amount DECIMAL(15,2) NOT NULL,
                    investment_date DATE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            `);

            // Create indexes
            await client.query(`
                CREATE INDEX idx_disbursement_schedules_investor_id ON disbursement_schedules(investor_id);
                CREATE INDEX idx_disbursement_schedules_investment_date ON disbursement_schedules(investment_date);
            `);

            console.log('✅ disbursement_schedules table created successfully');
        } else {
            console.log('✅ disbursement_schedules table already exists');
        }

        // Check if disbursement_detail table exists
        const detailsCheck = await client.query(`
            SELECT table_name FROM information_schema.tables
            WHERE table_name = 'disbursement_detail'
        `);

        if (detailsCheck.rows.length === 0) {
            console.log('⚠️ disbursement_detail table not found, creating it...');

            // Create disbursement_detail table
            await client.query(`
                CREATE TABLE disbursement_detail (
                    id BIGSERIAL PRIMARY KEY,
                    schedule_id BIGINT NOT NULL REFERENCES disbursement_schedules(id) ON DELETE CASCADE,
                    disbursement_number INTEGER NOT NULL,
                    disbursement_date DATE NOT NULL,
                    disbursement_amount DECIMAL(15,2) NOT NULL,
                    status VARCHAR(20) DEFAULT 'pending',
                    payment_reference TEXT,
                    notes TEXT,
                    paid_date DATE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            `);

            // Create indexes
            await client.query(`
                CREATE INDEX idx_disbursement_detail_schedule_id ON disbursement_detail(schedule_id);
                CREATE INDEX idx_disbursement_detail_date ON disbursement_detail(disbursement_date);
                CREATE INDEX idx_disbursement_detail_status ON disbursement_detail(status);
            `);

            console.log('✅ disbursement_detail table created successfully');
        } else {
            console.log('✅ disbursement_detail table already exists');
        }

    } catch (error) {
        console.error('❌ Error checking/creating disbursement tables:', error.message);
        throw error;
    }
};

/**
 * CREATE: Add a new coordinator with login credentials
 */
exports.addCoordinator = async (req, res) => {
    const { name, email, phone_number, password } = req.body;

    if (!name || !email || !phone_number || !password) {
        return res.status(400).json({ message: 'Name, email, phone number, and password are required.' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Ensure disbursement tables exist
        await ensureDisbursementTables(client);

        await client.query('LOCK TABLE coordinator IN EXCLUSIVE MODE');

        // Check if email already exists in coordinator table
        const existingCoordinator = await client.query(
            'SELECT coordinator_id FROM coordinator WHERE email = $1',
            [email]
        );

        if (existingCoordinator.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Coordinator with this email already exists.' });
        }

        // Check if email already exists in login table
        const existingLogin = await client.query(
            'SELECT user_id, role FROM login WHERE email = $1',
            [email]
        );

        if (existingLogin.rows.length > 0) {
            const existingUser = existingLogin.rows[0];

            // Check if this email belongs to an existing admin, vendor, or coordinator
            if (existingUser.role === 'admin' || existingUser.role === 'vendor' || existingUser.role === 'coordinator') {
                // This email is already used by an existing account
                await client.query('ROLLBACK');
                return res.status(409).json({
                    message: `An account with this email already exists as a ${existingUser.role}. Please use a different email address or contact support if you need to modify the existing account.`
                });
            } else {
                // This is a truly orphaned login entry (failed registration attempt)
                console.log('🧹 Cleaning up orphaned login entry for email:', email);
                await client.query('DELETE FROM login WHERE email = $1', [email]);
            }
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Generate coordinator ID in C_001 format
        const coordinatorIdRes = await client.query(`
            SELECT COALESCE(MAX(CAST(SUBSTRING(coordinator_id FROM 3) AS INTEGER)), 0) + 1 as next_num
            FROM coordinator WHERE coordinator_id LIKE 'C_%'
        `);
        const nextNum = coordinatorIdRes.rows[0].next_num;
        const coordinator_id = `C_${nextNum.toString().padStart(3, '0')}`;

        // Insert coordinator
        const coordinatorQuery = `
            INSERT INTO coordinator (coordinator_id, name, email, phone_number, created_at, last_updated)
            VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *;
        `;
        const coordinatorResult = await client.query(coordinatorQuery, [coordinator_id, name, email, phone_number]);

        // Insert login credentials
        const loginQuery = `
            INSERT INTO login (user_id, email, password, role, is_approved, status)
            VALUES ($1, $2, $3, 'coordinator', true, 'approved') RETURNING *;
        `;
        await client.query(loginQuery, [coordinator_id, email, hashedPassword]);

        await client.query('COMMIT');
        console.log('✅ Coordinator created successfully:', {
            coordinator_id: coordinator_id,
            name: name,
            email: email,
            role: 'coordinator'
        });

        res.status(201).json({
            success: true,
            coordinator: coordinatorResult.rows[0],
            message: 'Coordinator added successfully with login credentials.'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding coordinator:', error);

        // Provide more specific error messages
        let errorMessage = 'Failed to add coordinator.';
        if (error.code === '23505') {
            if (error.constraint === 'coordinator_email_key') {
                errorMessage = 'Coordinator with this email already exists.';
            } else if (error.constraint === 'login_email_key') {
                errorMessage = 'An account with this email already exists in the system.';
            } else {
                errorMessage = 'Coordinator with this information already exists.';
            }
        } else if (error.code === '23503') {
            errorMessage = 'Invalid reference data provided.';
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Database connection failed. Please try again.';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Request timed out. Please try again.';
        }

        res.status(500).json({
            message: errorMessage,
            error: error.message,
            code: error.code
        });
    } finally {
        client.release();
    }
};

/**
 * READ: Get all coordinators
 */
exports.getCoordinators = async (req, res) => {
    try {
        const query = `
            SELECT c.coordinator_id, c.name, c.email, c.phone_number,
                   c.created_at,
                   c.last_updated,
                   l.joining_date as last_login
            FROM coordinator c
            LEFT JOIN login l ON c.coordinator_id = l.user_id
            ORDER BY c.coordinator_id ASC
        `;
        const { rows } = await db.query(query);
        
        // Return coordinator data with proper timezone handling
        const processedRows = rows.map(coordinator => ({
            ...coordinator,
            // Timestamps are stored in UTC and converted by frontend as needed
        }));

        console.log('✅ Coordinator data fetched successfully:', {
            count: processedRows.length,
            coordinators: processedRows.map(c => ({
                id: c.coordinator_id,
                name: c.name,
                email: c.email
            }))
        });
        
        res.status(200).json({
            success: true,
            coordinators: processedRows
        });
    } catch (error) {
        console.error('Error fetching coordinators:', error);
        res.status(500).json({ message: 'Server error while fetching coordinators.' });
    }
};

/**
 * READ: Get coordinator by ID
 */
exports.getCoordinatorById = async (req, res) => {
    const { coordinatorId } = req.params;

    try {
        const query = `
            SELECT c.coordinator_id, c.name, c.email, c.phone_number,
                   c.created_at,
                   c.last_updated,
                   l.joining_date as last_login
            FROM coordinator c
            LEFT JOIN login l ON c.coordinator_id::text = l.user_id
            WHERE c.coordinator_id = $1
        `;
        const { rows } = await db.query(query, [coordinatorId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Coordinator not found.' });
        }

        res.status(200).json({
            success: true,
            coordinator: rows[0]
        });
    } catch (error) {
        console.error('Error fetching coordinator:', error);
        res.status(500).json({ message: 'Server error while fetching coordinator.' });
    }
};

/**
 * UPDATE: Update coordinator details
 */
exports.updateCoordinator = async (req, res) => {
    const { coordinatorId } = req.params;
    const { name, email, phone_number, password } = req.body;

    if (!name || !email || !phone_number) {
        return res.status(400).json({ message: 'Name, email, and phone number are required.' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Check if email already exists for another coordinator
        const existingCoordinator = await client.query(
            'SELECT coordinator_id FROM coordinator WHERE email = $1 AND coordinator_id != $2',
            [email, coordinatorId]
        );

        if (existingCoordinator.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Email already exists for another coordinator.' });
        }

        // Check if email already exists in login table for other roles (admin/vendor)
        const existingLogin = await client.query(
            'SELECT user_id, role FROM login WHERE email = $1 AND user_id != $2',
            [email, coordinatorId]
        );

        if (existingLogin.rows.length > 0) {
            const existingUser = existingLogin.rows[0];

            // Check if this email belongs to an existing admin or vendor
            if (existingUser.role === 'admin' || existingUser.role === 'vendor') {
                // This email is already used by an existing admin/vendor account
                await client.query('ROLLBACK');
                return res.status(409).json({
                    message: `An account with this email already exists as a ${existingUser.role}. Please use a different email address or contact support if you need to modify the existing account.`
                });
            }
        }

        // Update coordinator details
        const coordinatorQuery = `
            UPDATE coordinator 
            SET name = $1, email = $2, phone_number = $3, last_updated = NOW()
            WHERE coordinator_id = $4 RETURNING *;
        `;
        const coordinatorResult = await client.query(coordinatorQuery, [name, email, phone_number, coordinatorId]);

        if (coordinatorResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Coordinator not found.' });
        }

        // Update user email if changed
        await client.query(
            'UPDATE login SET email = $1 WHERE user_id = $2',
            [email, coordinatorId]
        );

        // Update password if provided
        if (password) {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            await client.query(
                'UPDATE login SET password = $1 WHERE user_id = $2',
                [hashedPassword, coordinatorId]
            );
        }

        await client.query('COMMIT');
        res.status(200).json({
            success: true,
            coordinator: coordinatorResult.rows[0],
            message: 'Coordinator updated successfully.'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating coordinator:', error);
        res.status(500).json({ message: 'Server error while updating coordinator.' });
    } finally {
        client.release();
    }
};

/**
 * DELETE: Delete coordinator and their login credentials
 */
exports.deleteCoordinator = async (req, res) => {
    const { coordinatorId } = req.params;

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Check if coordinator exists
        const coordinatorCheck = await client.query(
            'SELECT coordinator_id FROM coordinator WHERE coordinator_id = $1',
            [coordinatorId]
        );

        if (coordinatorCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Coordinator not found.' });
        }

        // Delete from login table first (foreign key constraint)
        await client.query('DELETE FROM login WHERE user_id = $1', [coordinatorId]);

        // Delete from coordinator table
        await client.query('DELETE FROM coordinator WHERE coordinator_id = $1', [coordinatorId]);

        await client.query('COMMIT');
        res.status(200).json({
            success: true,
            message: 'Coordinator deleted successfully.'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting coordinator:', error);
        res.status(500).json({ message: 'Server error while deleting coordinator.' });
    } finally {
        client.release();
    }
};


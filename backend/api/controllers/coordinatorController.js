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
                   c.created_at, c.last_updated,
                   l.joining_date as last_login
            FROM coordinator c
            LEFT JOIN login l ON c.coordinator_id = l.user_id
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
 * Get coordinator's assigned investors
 */
exports.getMyInvestors = async (req, res) => {
    try {
        const coordinatorId = req.user.user_id; // From auth middleware
        const { page = 1, limit = 50, search = '' } = req.query;
        
        const offset = (page - 1) * limit;
        let whereConditions = ['coordinator_id = $1'];
        let queryParams = [coordinatorId];
        let paramCount = 1;
        
        // Add search filter
        if (search) {
            paramCount++;
            whereConditions.push(`(first_name ILIKE $${paramCount} OR mobile_number ILIKE $${paramCount})`);
            queryParams.push(`%${search}%`);
        }
        
        const whereClause = whereConditions.join(' AND ');
        
        // Get investors with pagination - shows all investors regardless of approval status
        const query = `
            SELECT
                id, first_name, mobile_number, pan_card, coordinator, co_name,
                bank_account_number, bank_name, branch_name, ifsc_code, mode_of_payment,
                plan_type, select_plan, transaction_id, address, investment_date,
                approval_status, approved_by, approved_at, created_at
            FROM investordetails
            WHERE ${whereClause}
            ORDER BY investment_date DESC NULLS LAST
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `;
        
        // Count query
        const countQuery = `
            SELECT COUNT(*) as total
            FROM investordetails
            WHERE ${whereClause}
        `;
        
        queryParams.push(limit, offset);
        
        const [investorsResult, countResult] = await Promise.all([
            db.query(query, queryParams),
            db.query(countQuery, queryParams.slice(0, -2))
        ]);
        
        const totalCount = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(totalCount / limit);
        
        res.status(200).json({
            success: true,
            data: {
                investors: investorsResult.rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCount,
                    limit: parseInt(limit),
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Error fetching coordinator investors:', error);
        res.status(500).json({ message: 'Failed to fetch investors.' });
    }
};

/**
 * Get unassigned investors
 */
exports.getUnassignedInvestors = async (req, res) => {
    try {
        const { page = 1, limit = 50, search = '' } = req.query;
        
        const offset = (page - 1) * limit;
        let whereConditions = ['(coordinator_id IS NULL OR coordinator_id = \'\')'];
        let queryParams = [];
        let paramCount = 0;
        
        // Add search filter
        if (search) {
            paramCount++;
            whereConditions.push(`(first_name ILIKE $${paramCount} OR mobile_number ILIKE $${paramCount})`);
            queryParams.push(`%${search}%`);
        }
        
        const whereClause = whereConditions.join(' AND ');
        
        // Get unassigned investors with pagination - shows all investors regardless of approval status
        const query = `
            SELECT
                id, first_name, mobile_number, pan_card, coordinator, co_name,
                bank_account_number, bank_name, branch_name, ifsc_code, mode_of_payment,
                plan_type, select_plan, transaction_id, address, investment_date,
                approval_status, approved_by, approved_at, created_at
            FROM investordetails
            WHERE ${whereClause}
            ORDER BY investment_date DESC NULLS LAST
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `;
        
        // Count query
        const countQuery = `
            SELECT COUNT(*) as total
            FROM investordetails
            WHERE ${whereClause}
        `;
        
        queryParams.push(limit, offset);
        
        const [investorsResult, countResult] = await Promise.all([
            db.query(query, queryParams),
            db.query(countQuery, queryParams.slice(0, -2))
        ]);
        
        const totalCount = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(totalCount / limit);
        
        res.status(200).json({
            success: true,
            data: {
                investors: investorsResult.rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCount,
                    limit: parseInt(limit),
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Error fetching unassigned investors:', error);
        res.status(500).json({ message: 'Failed to fetch unassigned investors.' });
    }
};

/**
 * Assign investor to coordinator
 */
exports.assignInvestor = async (req, res) => {
    try {
        const { investorId } = req.params;
        const coordinatorId = req.user.user_id; // From auth middleware
        
        // Get coordinator name
        const coordinatorQuery = 'SELECT name FROM coordinator WHERE coordinator_id = $1';
        const coordinatorResult = await db.query(coordinatorQuery, [coordinatorId]);
        
        if (coordinatorResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid coordinator.' });
        }
        
        const coordinatorName = coordinatorResult.rows[0].name;
        
        // Update investor with coordinator assignment
        const updateQuery = `
            UPDATE investordetails
            SET coordinator_id = $1, coordinator = $2
            WHERE id = $3
            RETURNING *
        `;
        
        const { rows } = await db.query(updateQuery, [coordinatorId, coordinatorName, investorId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Investor not found.' });
        }
        
        res.status(200).json({
            success: true,
            message: 'Investor assigned successfully',
            investor: rows[0]
        });
    } catch (error) {
        console.error('Error assigning investor:', error);
        res.status(500).json({ message: 'Failed to assign investor.' });
    }
};

/**
 * Remove investor from coordinator
 */
exports.removeInvestor = async (req, res) => {
    try {
        const { investorId } = req.params;
        const coordinatorId = req.user.user_id; // From auth middleware
        
        // Update investor to remove coordinator assignment
        const updateQuery = `
            UPDATE investordetails
            SET coordinator_id = NULL, coordinator = NULL
            WHERE id = $1 AND coordinator_id = $2
            RETURNING *
        `;
        
        const { rows } = await db.query(updateQuery, [investorId, coordinatorId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Investor not found or not assigned to you.' });
        }
        
        res.status(200).json({
            success: true,
            message: 'Investor removed successfully',
            investor: rows[0]
        });
    } catch (error) {
        console.error('Error removing investor:', error);
        res.status(500).json({ message: 'Failed to remove investor.' });
    }
};

/**
 * Get coordinator investor statistics
 */
exports.getCoordinatorInvestorStats = async (req, res) => {
    try {
        const coordinatorId = req.user.user_id; // From auth middleware
        
        const query = `
            SELECT 
                COUNT(*) as total_my_investors,
                COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today_investors,
                COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as last_7_days_investors,
                COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as last_30_days_investors,
                COALESCE(SUM(
                    CASE 
                        WHEN select_plan = '10k' THEN 10000
                        WHEN select_plan = '50k' THEN 50000
                        WHEN select_plan = '1 lakh' THEN 100000
                        WHEN select_plan = '5 lakh' THEN 500000
                        WHEN select_plan = '10 lakh' THEN 1000000
                        ELSE 0
                    END
                ), 0) as total_investment_amount
            FROM investordetails
            WHERE coordinator_id = $1
        `;
        
        const { rows } = await db.query(query, [coordinatorId]);
        
        // Get unassigned investors count
        const unassignedQuery = `
            SELECT COUNT(*) as total_unassigned_investors
            FROM investordetails
            WHERE coordinator_id IS NULL OR coordinator_id = ''
        `;
        
        const { rows: unassignedRows } = await db.query(unassignedQuery);
        
        const stats = {
            ...rows[0],
            total_unassigned_investors: parseInt(unassignedRows[0].total_unassigned_investors),
            monthly_growth: 12.5, // This would be calculated based on historical data
            active_investors: parseInt(rows[0].total_my_investors), // Simplified for now
            pending_approvals: 0 // This would be calculated based on pending status
        };
        
        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching coordinator investor stats:', error);
        res.status(500).json({ message: 'Failed to fetch investor statistics.' });
    }
};

/**
 * Get coordinator disbursements
 */
exports.getCoordinatorDisbursements = async (req, res) => {
    const client = await db.connect();
    try {
        // Ensure disbursement tables exist
        await ensureDisbursementTables(client);
        
        const coordinatorId = req.user.user_id; // From auth middleware
        const { 
            status, 
            startDate, 
            endDate, 
            page = 1,
            limit = 50
        } = req.query;
        
        const offset = (page - 1) * limit;
        let whereConditions = ['i.coordinator_id = $1', 'i.approval_status = $2'];
        let queryParams = [coordinatorId, 'approved'];
        let paramCount = 2;
        
        // Build dynamic WHERE clause
        if (status) {
            if (status === 'overdue') {
                whereConditions.push(`dd.status = 'pending' AND dd.disbursement_date < CURRENT_DATE`);
            } else {
                paramCount++;
                whereConditions.push(`dd.status = $${paramCount}`);
                queryParams.push(status);
            }
        }
        
        if (startDate) {
            paramCount++;
            whereConditions.push(`dd.disbursement_date >= $${paramCount}`);
            queryParams.push(startDate);
        }
        
        if (endDate) {
            paramCount++;
            whereConditions.push(`dd.disbursement_date <= $${paramCount}`);
            queryParams.push(endDate);
        }
        
        const whereClause = whereConditions.join(' AND ');
        
        // Main query
        const mainQuery = `
            SELECT 
                dd.id,
                dd.disbursement_date,
                dd.disbursement_amount,
                dd.status,
                dd.payment_reference,
                dd.notes,
                dd.paid_date,
                dd.created_at,
                i.first_name,
                i.mobile_number,
                i.coordinator,
                i.plan_type,
                i.select_plan
            FROM disbursement_detail dd
            JOIN disbursement_schedules ds ON dd.schedule_id = ds.id
            JOIN investordetails i ON ds.investor_id = i.id
            WHERE ${whereClause}
            ORDER BY dd.disbursement_date DESC
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `;
        
        // Count query
        const countQuery = `
            SELECT COUNT(*) as total
            FROM disbursement_detail dd
            JOIN disbursement_schedules ds ON dd.schedule_id = ds.id
            JOIN investordetails i ON ds.investor_id = i.id
            WHERE ${whereClause}
        `;
        
        queryParams.push(limit, offset);
        
        const [disbursementsResult, countResult] = await Promise.all([
            client.query(mainQuery, queryParams),
            client.query(countQuery, queryParams.slice(0, -2))
        ]);
        
        const totalCount = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(totalCount / limit);
        
        res.status(200).json({
            success: true,
            data: {
                disbursements: disbursementsResult.rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCount,
                    limit: parseInt(limit),
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Error fetching coordinator disbursements:', error);
        res.status(500).json({ message: 'Failed to fetch disbursements.' });
    } finally {
        client.release();
    }
};

/**
 * Update disbursement status (coordinator)
 */
exports.updateDisbursement = async (req, res) => {
    const client = await db.connect();
    try {
        // Ensure disbursement tables exist
        await ensureDisbursementTables(client);
        
        const { disbursementId } = req.params;
        const coordinatorId = req.user.user_id; // From auth middleware
        const { status, paymentReference, notes } = req.body;
        
        if (!status || !['pending', 'paid', 'overdue'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be pending, paid, or overdue'
            });
        }
        
        // Verify the disbursement belongs to coordinator's investors
        const verifyQuery = `
            SELECT dd.id
            FROM disbursement_detail dd
            JOIN disbursement_schedules ds ON dd.schedule_id = ds.id
            JOIN investordetails i ON ds.investor_id = i.id
            WHERE dd.id = $1 AND i.coordinator_id = $2
        `;
        
        const { rows: verifyRows } = await client.query(verifyQuery, [disbursementId, coordinatorId]);
        
        if (verifyRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Disbursement not found or not assigned to you'
            });
        }
        
        // Update disbursement
        const updateQuery = `
            UPDATE disbursement_detail
            SET
                status = $1,
                paid_date = CASE WHEN $1 = 'paid' AND paid_date IS NULL THEN CURRENT_DATE ELSE paid_date END,
                payment_reference = COALESCE($2, payment_reference),
                notes = COALESCE($3, notes),
                updated_at = NOW()
            WHERE id = $4
            RETURNING *
        `;
        
        const { rows } = await client.query(updateQuery, [status, paymentReference, notes, disbursementId]);
        
        res.status(200).json({
            success: true,
            message: 'Disbursement updated successfully',
            disbursement: rows[0]
        });
    } catch (error) {
        console.error('Error updating disbursement:', error);
        res.status(500).json({ message: 'Failed to update disbursement.' });
    } finally {
        client.release();
    }
};

// All functions are exported individually above using exports.functionName

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
 * READ: Get coordinator profile (for logged-in coordinator)
 */
exports.getCoordinatorProfile = async (req, res) => {
    try {
        const coordinatorId = req.user.user_id; // From JWT token - FIXED: use user_id not userId

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
            return res.status(404).json({ message: 'Coordinator profile not found.' });
        }

        res.status(200).json({
            success: true,
            coordinator: rows[0]
        });
    } catch (error) {
        console.error('Error fetching coordinator profile:', error);
        res.status(500).json({ message: 'Server error while fetching coordinator profile.' });
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

/**
 * @desc    Assign vendor to current coordinator
 * @route   PUT /api/coordinator/assign-vendor/:vendorId
 * @access  Private (Coordinator)
 */
exports.assignVendor = async (req, res) => {
    const { vendorId } = req.params;
    const coordinatorId = req.user.user_id; // From JWT token - FIXED: use user_id not userId

    console.log('🔍 Assign vendor request:', {
        vendorId,
        coordinatorId,
        userId: req.user.user_id, // FIXED: use user_id not userId
        userRole: req.user.role,
        userEmail: req.user.email,
        fullUserObject: req.user
    });

    // Validate that the coordinator exists and is active
    console.log('🔍 Checking coordinator existence with ID:', coordinatorId);
    const coordinatorCheck = await db.query(
        'SELECT coordinator_id, name FROM coordinator WHERE coordinator_id::text = $1',
        [coordinatorId]
    );

    console.log('🔍 Coordinator check result:', {
        found: coordinatorCheck.rows.length > 0,
        coordinatorData: coordinatorCheck.rows[0] || 'Not found'
    });

    if (coordinatorCheck.rows.length === 0) {
        console.log('❌ Coordinator not found in database:', coordinatorId);
        return res.status(404).json({ message: 'Coordinator not found.' });
    }

    try {
        // Check if vendor exists and is approved
        console.log('🔍 Checking vendor existence with ID:', vendorId);
        const vendorCheck = await db.query(
            'SELECT v.id, v.vendor_name, v.coordinator_id, l.status FROM vendors v JOIN login l ON v.id = l.user_id WHERE v.id = $1 AND l.role = \'vendor\' AND l.status = \'approved\'',
            [vendorId]
        );

        console.log('🔍 Vendor check result:', {
            found: vendorCheck.rows.length > 0,
            vendorData: vendorCheck.rows[0] || 'Not found'
        });

        if (vendorCheck.rows.length === 0) {
            console.log('❌ Vendor not found or not approved:', vendorId);
            return res.status(404).json({ message: 'Vendor not found or not approved.' });
        }

        const vendor = vendorCheck.rows[0];

        // Check if vendor is already assigned to this coordinator
        console.log('🔍 Checking vendor assignment:', {
            vendorCoordinatorId: vendor.coordinator_id,
            currentCoordinatorId: coordinatorId,
            alreadyAssigned: vendor.coordinator_id === coordinatorId
        });

        if (vendor.coordinator_id === coordinatorId) {
            console.log('⚠️ Vendor already assigned to this coordinator');
            return res.status(400).json({ message: 'Vendor is already assigned to you.' });
        }

        // Update vendor coordinator assignment
        console.log('🔄 Updating vendor assignment:', {
            vendorId,
            coordinatorId,
            vendorName: vendor.vendor_name
        });

        const query = `
            UPDATE vendors
            SET coordinator_id = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *;
        `;

        const { rows } = await db.query(query, [coordinatorId, vendorId]);

        console.log('🔄 Assignment update result:', {
            rowsAffected: rows.length,
            updatedVendor: rows[0] || 'No rows updated'
        });

        if (rows.length === 0) {
            console.log('❌ Failed to update vendor assignment - no rows affected');
            return res.status(404).json({ message: 'Failed to update vendor assignment.' });
        }

        console.log('✅ Vendor assigned to coordinator successfully:', {
            vendorId,
            vendorName: vendor.vendor_name,
            coordinatorId,
            coordinatorName: coordinatorCheck.rows[0].name,
            updatedVendor: rows[0]
        });

        res.status(200).json({
            success: true,
            vendor: rows[0],
            message: `Vendor ${vendor.vendor_name} has been assigned to you successfully.`
        });
    } catch (error) {
        console.error('❌ Error assigning vendor to coordinator:', error);
        res.status(500).json({ message: 'Failed to assign vendor.' });
    }
};

/**
 * @desc    Remove vendor from current coordinator (unassign)
 * @route   DELETE /api/coordinator/remove-vendor/:vendorId
 * @access  Private (Coordinator)
 */
exports.removeVendor = async (req, res) => {
    const { vendorId } = req.params;
    const coordinatorId = req.user.user_id; // From JWT token

    console.log('🗑️ Remove vendor request:', {
        vendorId,
        coordinatorId,
        userId: req.user.user_id,
        userRole: req.user.role,
        userEmail: req.user.email,
        fullUserObject: req.user
    });

    // Validate that the coordinator exists and is active
    console.log('🔍 Checking coordinator existence with ID:', coordinatorId);
    const coordinatorCheck = await db.query(
        'SELECT coordinator_id, name FROM coordinator WHERE coordinator_id::text = $1',
        [coordinatorId]
    );

    console.log('🔍 Coordinator check result:', {
        found: coordinatorCheck.rows.length > 0,
        coordinatorData: coordinatorCheck.rows[0] || 'Not found'
    });

    if (coordinatorCheck.rows.length === 0) {
        console.log('❌ Coordinator not found in database:', coordinatorId);
        return res.status(404).json({ message: 'Coordinator not found.' });
    }

    try {
        // Check if vendor exists and is assigned to this coordinator
        console.log('🔍 Checking vendor assignment with ID:', vendorId);
        const vendorCheck = await db.query(
            'SELECT v.id, v.vendor_name, v.coordinator_id, l.status FROM vendors v JOIN login l ON v.id = l.user_id WHERE v.id = $1 AND l.role = \'vendor\' AND l.status = \'approved\'',
            [vendorId]
        );

        console.log('🔍 Vendor check result:', {
            found: vendorCheck.rows.length > 0,
            vendorData: vendorCheck.rows[0] || 'Not found'
        });

        if (vendorCheck.rows.length === 0) {
            console.log('❌ Vendor not found or not approved:', vendorId);
            return res.status(404).json({ message: 'Vendor not found or not approved.' });
        }

        const vendor = vendorCheck.rows[0];

        // Check if vendor is actually assigned to this coordinator
        console.log('🔍 Checking vendor assignment:', {
            vendorCoordinatorId: vendor.coordinator_id,
            currentCoordinatorId: coordinatorId,
            isAssignedToMe: vendor.coordinator_id === coordinatorId
        });

        if (vendor.coordinator_id !== coordinatorId) {
            console.log('⚠️ Vendor is not assigned to this coordinator');
            return res.status(400).json({ message: 'Vendor is not assigned to you.' });
        }

        // Remove vendor from coordinator assignment (set coordinator_id to NULL)
        console.log('🔄 Removing vendor from coordinator:', {
            vendorId,
            coordinatorId,
            vendorName: vendor.vendor_name
        });

        const query = `
            UPDATE vendors
            SET coordinator_id = NULL, updated_at = NOW()
            WHERE id = $1
            RETURNING *;
        `;

        const { rows } = await db.query(query, [vendorId]);

        console.log('🔄 Removal update result:', {
            rowsAffected: rows.length,
            updatedVendor: rows[0] || 'No rows updated'
        });

        if (rows.length === 0) {
            console.log('❌ Failed to remove vendor assignment - no rows affected');
            return res.status(404).json({ message: 'Failed to remove vendor assignment.' });
        }

        console.log('✅ Vendor removed from coordinator successfully:', {
            vendorId,
            vendorName: vendor.vendor_name,
            coordinatorId,
            coordinatorName: coordinatorCheck.rows[0].name,
            updatedVendor: rows[0]
        });

        res.status(200).json({
            success: true,
            vendor: rows[0],
            message: `Vendor ${vendor.vendor_name} has been removed from your coordination successfully.`
        });
    } catch (error) {
        console.error('❌ Error removing vendor from coordinator:', error);
        res.status(500).json({ message: 'Failed to remove vendor.' });
    }
};

/**
 * @desc    Get count of vendors assigned to current coordinator
 * @route   GET /api/coordinator/vendors/my-count
 * @access  Private (Coordinator)
 */
exports.getMyVendorsCount = async (req, res) => {
    try {
        const coordinatorId = req.user.user_id; // Current coordinator ID
        
        console.log('🔍 Backend Debug - getMyVendorsCount called with coordinator ID:', coordinatorId);

        const countQuery = `
            SELECT COUNT(*) as count 
            FROM vendors v
            JOIN login l ON v.id = l.user_id
            WHERE l.role = 'vendor' 
            AND v.coordinator_id = $1
        `;

        console.log('🔍 Backend Debug - Count query:', countQuery);
        console.log('🔍 Backend Debug - Query params:', [coordinatorId]);

        const result = await db.query(countQuery, [coordinatorId]);
        const count = parseInt(result.rows[0].count, 10);

        console.log('🔍 Backend Debug - Count result:', result.rows[0]);
        console.log('🔍 Backend Debug - Parsed count:', count);

        // Add cache-busting headers
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        res.status(200).json({
            success: true,
            count: count,
            coordinator_id: coordinatorId
        });

    } catch (error) {
        console.error('❌ Error fetching my vendors count:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch my vendors count.' 
        });
    }
};

/**
 * @desc    Get a paginated, searchable, and sortable list of ALL vendors for coordinators
 * @route   GET /api/coordinator/vendors/paginated
 * @access  Private (Coordinator)
 */
exports.getVendorsPaginated = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortBy = 'created_at',
            sortOrder = 'desc',
            search = '',
            filter = 'all' // 'all', 'my', 'unassigned'
        } = req.query;

        console.log('🔍 Backend Debug - getVendorsPaginated called with:', {
            page, limit, sortBy, sortOrder, search, filter,
            user_id: req.user?.user_id,
            user_role: req.user?.role
        });

        // ✅ Define allowed columns for sorting
        const allowedSortBy = [
            'vendor_name', 'id', 'email', 'phone_number', 
            'created_at', 'wallet_balance', 'percentage', 'status'
        ];
        if (!allowedSortBy.includes(sortBy)) {
            console.log('❌ Backend Debug - Invalid sort column:', sortBy);
            return res.status(400).json({ message: 'Invalid sort column.' });
        }
        
        // ✅ Map sortBy to the correct table and column name
        let sortColumn;
        switch (sortBy) {
            case 'wallet_balance': sortColumn = 'w.digital_money'; break;
            case 'percentage':     sortColumn = 'w.percentage'; break;
            case 'created_at':     sortColumn = 'v.created_at'; break;
            case 'status':         sortColumn = 'l.status'; break;
            default:               sortColumn = `v.${sortBy}`;
        }
        
        const sanitizedSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

        const coordinatorId = req.user.user_id; // Current coordinator ID
        console.log('🔍 Backend Debug - Coordinator ID extracted:', coordinatorId, 'Type:', typeof coordinatorId);
        
        const queryParams = [];
        // ✅ Base query to fetch all vendors with coordinator information
        let baseQuery = `
            FROM vendors v
            JOIN login l ON v.id = l.user_id
            LEFT JOIN wallet w ON v.id = w.id
            LEFT JOIN coordinator c ON v.coordinator_id = c.coordinator_id
            WHERE l.role = 'vendor'
        `;

        console.log('🔍 Backend Debug - Base query:', baseQuery);

        // Add filter conditions
        switch (filter) {
            case 'my':
                queryParams.push(coordinatorId);
                const myFilterIndex = queryParams.length;
                baseQuery += ` AND v.coordinator_id = $${myFilterIndex}`;
                console.log('🔍 Backend Debug - My filter applied. Query params:', queryParams);
                console.log('🔍 Backend Debug - Final query with my filter:', baseQuery);
                break;
            case 'unassigned':
                baseQuery += ` AND v.coordinator_id IS NULL`;
                console.log('🔍 Backend Debug - Unassigned filter applied');
                break;
            case 'all':
            default:
                console.log('🔍 Backend Debug - No additional filter (showing all)');
                break;
        }

        // ✅ Robust search across multiple relevant columns
        if (search) {
            queryParams.push(`%${search}%`);
            const searchIndex = queryParams.length;
            baseQuery += ` AND (v.vendor_name ILIKE $${searchIndex} OR v.id ILIKE $${searchIndex} OR v.email ILIKE $${searchIndex} OR v.phone_number ILIKE $${searchIndex} OR l.status ILIKE $${searchIndex} OR c.name ILIKE $${searchIndex})`;
        }
        
        // --- Get Total Count for Pagination ---
        const countQuery = `SELECT COUNT(*) ${baseQuery}`;
        console.log('🔍 Backend Debug - Count query:', countQuery);
        console.log('🔍 Backend Debug - Count query params:', queryParams);
        
        const totalResult = await db.query(countQuery, queryParams);
        console.log('🔍 Backend Debug - Count query result:', totalResult.rows);
        
        const totalCount = parseInt(totalResult.rows[0].count, 10);
        console.log('🔍 Backend Debug - Parsed total count:', totalCount);

        // --- Get Paginated Data ---
        const offset = (page - 1) * limit;
        const dataQuery = `
            SELECT 
                v.id,
                v.vendor_name,
                v.email,
                v.phone_number,
                v.created_at AS joining_date,
                v.passport_photo_url,
                v.coordinator_id,
                c.name AS coordinator_name,
                l.status,
                COALESCE(w.digital_money, 0) AS wallet_balance,
                w.percentage
            ${baseQuery}
            ORDER BY ${sortColumn} ${sanitizedSortOrder} NULLS LAST
            LIMIT $${queryParams.length + 1} 
            OFFSET $${queryParams.length + 2}
        `;
        
        console.log('🔍 Backend Debug - Data query:', dataQuery);
        console.log('🔍 Backend Debug - Data query params:', [...queryParams, limit, offset]);
        
        const dataResult = await db.query(dataQuery, [...queryParams, limit, offset]);
        console.log('🔍 Backend Debug - Data query result rows:', dataResult.rows.length);
        console.log('🔍 Backend Debug - Sample data row:', dataResult.rows[0] || 'No rows returned');

        const response = {
            data: dataResult.rows,
            totalCount,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            totalPages: Math.ceil(totalCount / limit)
        };

        console.log('✅ Coordinator vendors data fetched successfully:', {
            count: dataResult.rows.length,
            totalCount,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10)
        });

        console.log('🔍 Backend Debug - Final response:', response);
        
        // Add cache-busting headers
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        res.status(200).json(response);

    } catch (error) {
        console.error('❌ Error fetching coordinator vendors:', error);
        res.status(500).json({ message: 'Failed to fetch vendors.' });
    }
};

/**
 * @desc    Get count of vendors from last 8 days
 * @route   GET /api/coordinator/vendors/last8days
 * @access  Private (Coordinator)
 */
exports.getVendorsLast8Days = async (req, res) => {
    try {
        const query = `
            SELECT COUNT(*) as count 
            FROM vendors v
            JOIN login l ON v.id = l.user_id
            WHERE l.role = 'vendor' 
            AND l.status = 'approved' 
            AND v.created_at >= NOW() - INTERVAL '8 days'
        `;
        const result = await db.query(query);
        const count = parseInt(result.rows[0].count, 10);
        
        res.status(200).json({ count });
    } catch (error) {
        console.error('❌ Error fetching last 8 days vendors:', error);
        res.status(500).json({ message: 'Failed to fetch last 8 days vendors.' });
    }
};

/**
 * @desc Get count of MY vendors from last 8 days
 * @route GET /api/coordinator/vendors/last8days/my-count
 * @access Private (Coordinator)
 */
exports.getMyVendorsLast8DaysCount = async (req, res) => {
    try {
        const coordinatorId = req.user.user_id;
        
        console.log('🔍 Backend Debug - getMyVendorsLast8DaysCount called with coordinator ID:', coordinatorId);

        const countQuery = `
            SELECT COUNT(*) as count 
            FROM vendors v
            JOIN login l ON v.id = l.user_id
            WHERE l.role = 'vendor' 
            AND l.status = 'approved' 
            AND v.created_at >= NOW() - INTERVAL '8 days'
            AND v.coordinator_id = $1
        `;

        console.log('🔍 Backend Debug - Last 8 Days Count query:', countQuery);
        console.log('🔍 Backend Debug - Query params:', [coordinatorId]);

        const result = await db.query(countQuery, [coordinatorId]);
        const count = parseInt(result.rows[0].count, 10);

        console.log('🔍 Backend Debug - Last 8 Days Count result:', result.rows[0]);
        console.log('🔍 Backend Debug - Parsed count:', count);

        // Add cache-busting headers
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        res.status(200).json({
            success: true,
            count: count,
            coordinator_id: coordinatorId
        });

    } catch (error) {
        console.error('❌ Error fetching my vendors last 8 days count:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch my vendors last 8 days count.' 
        });
    }
};

/**
 * @desc    Get paginated vendors from last 8 days with filtering
 * @route   GET /api/coordinator/vendors/last8days/paginated
 * @access  Private (Coordinator)
 */
exports.getVendorsLast8DaysPaginated = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortBy = 'created_at',
            sortOrder = 'DESC',
            search = '',
            filter = 'all' // 'all', 'my', 'unassigned'
        } = req.query;

        const coordinatorId = req.user.user_id; // Current coordinator ID

        // Validate sortBy to prevent SQL injection
        const allowedSortFields = ['created_at', 'vendor_name', 'email', 'phone_number', 'id'];
        const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
        
        // Validate sortOrder
        const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // Build base query for last 8 days
        let baseQuery = `
            FROM vendors v
            JOIN login l ON v.id = l.user_id
            LEFT JOIN wallet w ON v.id = w.id
            LEFT JOIN coordinator c ON v.coordinator_id = c.coordinator_id
            WHERE l.role = 'vendor' 
            AND l.status = 'approved' 
            AND v.created_at >= NOW() - INTERVAL '8 days'
        `;

        // Add filter conditions
        let vendorParams = [];
        switch (filter) {
            case 'my':
                vendorParams.push(coordinatorId);
                const myFilterIndex = vendorParams.length;
                baseQuery += ` AND v.coordinator_id = $${myFilterIndex}`;
                break;
            case 'unassigned':
                baseQuery += ` AND v.coordinator_id IS NULL`;
                break;
            case 'all':
            default:
                // No additional filter
                break;
        }
        
        // Count total vendors matching criteria
        const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
        const countResult = await db.query(countQuery, vendorParams);
        const total = parseInt(countResult.rows[0].total, 10);
        
        // Add search condition if provided
        let finalBaseQuery = baseQuery;
        
        if (search) {
            finalBaseQuery += ` AND (v.vendor_name ILIKE $${vendorParams.length + 1} OR v.id ILIKE $${vendorParams.length + 1} OR v.email ILIKE $${vendorParams.length + 1} OR v.phone_number ILIKE $${vendorParams.length + 1} OR l.status ILIKE $${vendorParams.length + 1} OR c.name ILIKE $${vendorParams.length + 1})`;
            vendorParams.push(`%${search}%`);
        }
        
        // Add limit and offset parameters
        vendorParams.push(parseInt(limit), offset);
        
        // Get paginated vendors
        const vendorsQuery = `
            SELECT 
                v.id,
                v.vendor_name,
                v.email,
                v.phone_number,
                v.created_at AS joining_date,
                v.passport_photo_url,
                v.coordinator_id,
                c.name AS coordinator_name,
                l.status,
                COALESCE(w.digital_money, 0) AS wallet_balance,
                w.percentage
            ${finalBaseQuery}
            ORDER BY v.${validSortBy} ${validSortOrder} NULLS LAST
            LIMIT $${vendorParams.length - 1} OFFSET $${vendorParams.length}
        `;
            
        const vendorsResult = await db.query(vendorsQuery, vendorParams);
        
        const totalPages = Math.ceil(total / parseInt(limit));
        
        console.log('✅ Coordinator last 8 days vendors fetched:', {
            filter,
            count: vendorsResult.rows.length,
            total,
            page: parseInt(page),
            limit: parseInt(limit)
        });
        
        // Add cache-busting headers
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        res.status(200).json({
            success: true,
            data: vendorsResult.rows,
            total,
            totalPages,
            page: parseInt(page),
            limit: parseInt(limit)
        });
        
    } catch (error) {
        console.error('❌ Error fetching paginated vendors from last 8 days:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch vendors from last 8 days.' 
        });
    }
};

/**
 * @desc    Get count of vendors from today
 * @route   GET /api/coordinator/vendors/today
 * @access  Private (Coordinator)
 */
exports.getVendorsToday = async (req, res) => {
    try {
        const query = `
            SELECT COUNT(*) as count 
            FROM vendors v
            JOIN login l ON v.id = l.user_id
            WHERE l.role = 'vendor' 
            AND l.status = 'approved' 
            AND DATE(v.created_at) = CURRENT_DATE
        `;
        const result = await db.query(query);
        const count = parseInt(result.rows[0].count, 10);
        
        res.status(200).json({ count });
    } catch (error) {
        console.error('❌ Error fetching today vendors:', error);
        res.status(500).json({ message: 'Failed to fetch today vendors.' });
    }
};

/**
 * @desc Get count of MY vendors from today
 * @route GET /api/coordinator/vendors/today/my-count
 * @access Private (Coordinator)
 */
exports.getMyVendorsTodayCount = async (req, res) => {
    try {
        const coordinatorId = req.user.user_id;
        
        console.log('🔍 Backend Debug - getMyVendorsTodayCount called with coordinator ID:', coordinatorId);

        const countQuery = `
            SELECT COUNT(*) as count 
            FROM vendors v
            JOIN login l ON v.id = l.user_id
            WHERE l.role = 'vendor' 
            AND l.status = 'approved' 
            AND DATE(v.created_at) = CURRENT_DATE
            AND v.coordinator_id = $1
        `;

        console.log('🔍 Backend Debug - Today Count query:', countQuery);
        console.log('🔍 Backend Debug - Query params:', [coordinatorId]);

        const result = await db.query(countQuery, [coordinatorId]);
        const count = parseInt(result.rows[0].count, 10);

        console.log('🔍 Backend Debug - Today Count result:', result.rows[0]);
        console.log('🔍 Backend Debug - Parsed count:', count);

        // Add cache-busting headers
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        res.status(200).json({
            success: true,
            count: count,
            coordinator_id: coordinatorId
        });

    } catch (error) {
        console.error('❌ Error fetching my vendors today count:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch my vendors today count.' 
        });
    }
};

/**
 * @desc    Get paginated vendors from today with filtering
 * @route   GET /api/coordinator/vendors/today/paginated
 * @access  Private (Coordinator)
 */
exports.getVendorsTodayPaginated = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortBy = 'created_at',
            sortOrder = 'DESC',
            search = '',
            filter = 'all' // 'all', 'my', 'unassigned'
        } = req.query;

        const coordinatorId = req.user.user_id; // Current coordinator ID

        // Validate sortBy to prevent SQL injection
        const allowedSortFields = ['created_at', 'vendor_name', 'email', 'phone_number', 'id'];
        const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
        
        // Validate sortOrder
        const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // Build base query for today
        let baseQuery = `
            FROM vendors v
            JOIN login l ON v.id = l.user_id
            LEFT JOIN wallet w ON v.id = w.id
            LEFT JOIN coordinator c ON v.coordinator_id = c.coordinator_id
            WHERE l.role = 'vendor' 
            AND l.status = 'approved' 
            AND DATE(v.created_at) = CURRENT_DATE
        `;

        // Add filter conditions
        let vendorParams = [];
        switch (filter) {
            case 'my':
                vendorParams.push(coordinatorId);
                const myFilterIndex = vendorParams.length;
                baseQuery += ` AND v.coordinator_id = $${myFilterIndex}`;
                break;
            case 'unassigned':
                baseQuery += ` AND v.coordinator_id IS NULL`;
                break;
            case 'all':
            default:
                // No additional filter
                break;
        }
        
        // Count total vendors matching criteria
        const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
        const countResult = await db.query(countQuery, vendorParams);
        const total = parseInt(countResult.rows[0].total, 10);
        
        // Add search condition if provided
        let finalBaseQuery = baseQuery;
        
        if (search) {
            finalBaseQuery += ` AND (v.vendor_name ILIKE $${vendorParams.length + 1} OR v.id ILIKE $${vendorParams.length + 1} OR v.email ILIKE $${vendorParams.length + 1} OR v.phone_number ILIKE $${vendorParams.length + 1} OR l.status ILIKE $${vendorParams.length + 1} OR c.name ILIKE $${vendorParams.length + 1})`;
            vendorParams.push(`%${search}%`);
        }
        
        // Add limit and offset parameters
        vendorParams.push(parseInt(limit), offset);
        
        // Get paginated vendors
        const vendorsQuery = `
            SELECT 
                v.id,
                v.vendor_name,
                v.email,
                v.phone_number,
                v.created_at AS joining_date,
                v.passport_photo_url,
                v.coordinator_id,
                c.name AS coordinator_name,
                l.status,
                COALESCE(w.digital_money, 0) AS wallet_balance,
                w.percentage
            ${finalBaseQuery}
            ORDER BY v.${validSortBy} ${validSortOrder} NULLS LAST
            LIMIT $${vendorParams.length - 1} OFFSET $${vendorParams.length}
        `;
            
        const vendorsResult = await db.query(vendorsQuery, vendorParams);
        
        const totalPages = Math.ceil(total / parseInt(limit));
        
        console.log('✅ Coordinator today vendors fetched:', {
            filter,
            count: vendorsResult.rows.length,
            total,
            page: parseInt(page),
            limit: parseInt(limit)
        });
        
        // Add cache-busting headers
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        res.status(200).json({
            success: true,
            data: vendorsResult.rows,
            total,
            totalPages,
            page: parseInt(page),
            limit: parseInt(limit)
        });
        
    } catch (error) {
        console.error('❌ Error fetching paginated vendors from today:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch vendors from today.' 
        });
    }
};

/**
 * @desc    Get transactions for vendors assigned to the coordinator
 * @route   GET /api/coordinator/transactions
 * @access  Private (Coordinator)
 */
exports.getCoordinatorVendorTransactions = async (req, res) => {
    try {
        console.log('🔍 Coordinator transaction request:', {
            user: req.user,
            userRole: req.user?.role,
            userId: req.user?.user_id,
            headers: req.headers
        });

        const {
            page = 1,
            limit = 10,
            sortBy = 'created_at',
            sortOrder = 'desc',
            search = '',
            transaction_type = '',
            startDate = '',
            endDate = ''
        } = req.query;

        const coordinatorId = req.user.user_id; // Current coordinator ID

        // Validate sortBy to prevent SQL injection
        const allowedSortBy = [
            'trans_id', 'created_at', 'user_id', 'vendor_name', 'balance_after_transaction',
            'transaction_type', 'amount', 'status', 'description'
        ];
        if (!allowedSortBy.includes(sortBy)) {
            return res.status(400).json({ message: 'Invalid sort column.' });
        }
        
        const sortColumn = sortBy === 'vendor_name' ? 'v.vendor_name' : `t.${sortBy}`;
        const sanitizedSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

        const queryParams = [coordinatorId];
        let baseQuery = `
            FROM transaction t 
            LEFT JOIN vendors v ON t.user_id = v.id 
            WHERE v.coordinator_id = $1
        `;

        // Add search filter
        if (search) {
            queryParams.push(`%${search}%`);
            const searchIndex = queryParams.length;
            baseQuery += ` AND (t.user_id ILIKE $${searchIndex} OR t.upi_transaction_id ILIKE $${searchIndex} OR t.description ILIKE $${searchIndex} OR v.vendor_name ILIKE $${searchIndex} OR v.email ILIKE $${searchIndex} OR v.phone_number ILIKE $${searchIndex})`;
        }

        // Add transaction type filter
        if (transaction_type) {
            queryParams.push(transaction_type);
            baseQuery += ` AND t.transaction_type = $${queryParams.length}`;
        }

        // Add date filters
        if (startDate) {
            queryParams.push(startDate);
            baseQuery += ` AND t.created_at >= $${queryParams.length}`;
        }
        if (endDate) {
            queryParams.push(endDate);
            baseQuery += ` AND t.created_at < ($${queryParams.length}::date + interval '1 day')`;
        }
        
        // Get total count
        const countQuery = `SELECT COUNT(*) ${baseQuery}`;
        const totalResult = await db.query(countQuery, queryParams);
        const totalCount = parseInt(totalResult.rows[0].count, 10);

        const offset = (page - 1) * limit;
        
        // Get paginated data
        const dataQuery = `
            SELECT 
                t.trans_id, 
                t.created_at as created_at,
                t.user_id, 
                t.balance_after_transaction, 
                t.transaction_type, 
                t.amount, 
                t.status, 
                t.description, 
                t.upi_transaction_id,
                v.vendor_name, 
                v.email, 
                v.phone_number
            ${baseQuery}
            ORDER BY ${sortColumn} ${sanitizedSortOrder}
            LIMIT $${queryParams.length + 1} 
            OFFSET $${queryParams.length + 2}
        `;
        
        const dataResult = await db.query(dataQuery, [...queryParams, limit, offset]);

        console.log('✅ Coordinator vendor transactions fetched:', {
            coordinatorId,
            count: dataResult.rows.length,
            totalCount,
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.status(200).json({
            success: true,
            data: dataResult.rows,
            totalCount,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            totalPages: Math.ceil(totalCount / limit)
        });

    } catch (error) {
        console.error('❌ Error fetching coordinator vendor transactions:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch vendor transactions.' 
        });
    }
};

/**
 * @desc    Get disbursement statistics for coordinator's assigned investors
 * @route   GET /api/coordinator/disbursements/stats
 * @access  Private (Coordinator)
 */
exports.getCoordinatorDisbursementStats = async (req, res) => {
    const client = await db.connect();
    try {
        // Ensure disbursement tables exist
        await ensureDisbursementTables(client);
        
        const coordinatorId = req.user.user_id; // Current coordinator ID
        
        // Get start and end of next 15 days (including today)
        const startOf15Days = new Date();
        const endOf15Days = new Date();
        endOf15Days.setDate(startOf15Days.getDate() + 15);

        // Pending disbursements (due today) for coordinator's approved investors
        const pendingTodayQuery = `
            SELECT 
                COALESCE(SUM(dd.disbursement_amount), 0) as total_amount,
                COUNT(*) as disbursement_count
            FROM disbursement_detail dd
            JOIN disbursement_schedules ds ON dd.schedule_id = ds.id
            JOIN investordetails i ON ds.investor_id = i.id
            WHERE dd.status = 'pending'
            AND DATE(dd.disbursement_date) = CURRENT_DATE
            AND i.coordinator_id = $1
            AND i.approval_status = 'approved'
        `;

        // Total disbursed (all time) for coordinator's approved investors
        const totalDisbursedQuery = `
            SELECT 
                COALESCE(SUM(dd.disbursement_amount), 0) as total_amount,
                COUNT(*) as disbursement_count
            FROM disbursement_detail dd
            JOIN disbursement_schedules ds ON dd.schedule_id = ds.id
            JOIN investordetails i ON ds.investor_id = i.id
            WHERE dd.status = 'paid'
            AND i.coordinator_id = $1
            AND i.approval_status = 'approved'
        `;

        // Total invested (all time) for coordinator's approved investors
        const totalInvestedQuery = `
            SELECT 
                COALESCE(SUM(ds.investment_amount), 0) as total_amount,
                COUNT(*) as disbursement_count
            FROM disbursement_schedules ds
            JOIN investordetails i ON ds.investor_id = i.id
            WHERE i.coordinator_id = $1
            AND i.approval_status = 'approved'
        `;

        // Pending disbursements (due tomorrow) for coordinator's approved investors
        const pendingTomorrowQuery = `
            SELECT 
                COALESCE(SUM(dd.disbursement_amount), 0) as total_amount,
                COUNT(*) as disbursement_count
            FROM disbursement_detail dd
            JOIN disbursement_schedules ds ON dd.schedule_id = ds.id
            JOIN investordetails i ON ds.investor_id = i.id
            WHERE dd.status = 'pending'
            AND DATE(dd.disbursement_date) = CURRENT_DATE + INTERVAL '1 day'
            AND i.coordinator_id = $1
            AND i.approval_status = 'approved'
        `;

        // Upcoming disbursements (future) for coordinator's approved investors
        const upcomingQuery = `
            SELECT 
                COALESCE(SUM(dd.disbursement_amount), 0) as total_amount,
                COUNT(*) as disbursement_count
            FROM disbursement_detail dd
            JOIN disbursement_schedules ds ON dd.schedule_id = ds.id
            JOIN investordetails i ON ds.investor_id = i.id
            WHERE dd.status = 'pending'
            AND DATE(dd.disbursement_date) > CURRENT_DATE + INTERVAL '1 day'
            AND i.coordinator_id = $1
            AND i.approval_status = 'approved'
        `;

        // Overdue disbursements (past) for coordinator's approved investors
        const overdueQuery = `
            SELECT 
                COALESCE(SUM(dd.disbursement_amount), 0) as total_amount,
                COUNT(*) as disbursement_count
            FROM disbursement_detail dd
            JOIN disbursement_schedules ds ON dd.schedule_id = ds.id
            JOIN investordetails i ON ds.investor_id = i.id
            WHERE dd.status = 'pending'
            AND DATE(dd.disbursement_date) < CURRENT_DATE
            AND i.coordinator_id = $1
            AND i.approval_status = 'approved'
        `;

        // Future 15 days disbursements for coordinator's approved investors
        const future15DaysQuery = `
            SELECT
                COALESCE(SUM(dd.disbursement_amount), 0) as total_amount,
                COUNT(*) as disbursement_count
            FROM disbursement_detail dd
            JOIN disbursement_schedules ds ON dd.schedule_id = ds.id
            JOIN investordetails i ON ds.investor_id = i.id
            WHERE dd.status = 'pending'
            AND DATE(dd.disbursement_date) >= CURRENT_DATE
            AND DATE(dd.disbursement_date) <= DATE($2)
            AND i.coordinator_id = $1
            AND i.approval_status = 'approved'
        `;

        // Execute all queries
        const [
            pendingTodayResult,
            totalDisbursedResult,
            totalInvestedResult,
            pendingTomorrowResult,
            upcomingResult,
            overdueResult,
            future15DaysResult
        ] = await Promise.all([
            client.query(pendingTodayQuery, [coordinatorId]),
            client.query(totalDisbursedQuery, [coordinatorId]),
            client.query(totalInvestedQuery, [coordinatorId]),
            client.query(pendingTomorrowQuery, [coordinatorId]),
            client.query(upcomingQuery, [coordinatorId]),
            client.query(overdueQuery, [coordinatorId]),
            client.query(future15DaysQuery, [coordinatorId, endOf15Days])
        ]);

        const stats = {
            pendingToday: {
                amount: parseFloat(pendingTodayResult.rows[0].total_amount) || 0,
                count: parseInt(pendingTodayResult.rows[0].disbursement_count) || 0
            },
            totalDisbursed: {
                amount: parseFloat(totalDisbursedResult.rows[0].total_amount) || 0,
                count: parseInt(totalDisbursedResult.rows[0].disbursement_count) || 0
            },
            totalInvested: {
                amount: parseFloat(totalInvestedResult.rows[0].total_amount) || 0,
                count: parseInt(totalInvestedResult.rows[0].disbursement_count) || 0
            },
            pendingTomorrow: {
                amount: parseFloat(pendingTomorrowResult.rows[0].total_amount) || 0,
                count: parseInt(pendingTomorrowResult.rows[0].disbursement_count) || 0
            },
            upcoming: {
                amount: parseFloat(upcomingResult.rows[0].total_amount) || 0,
                count: parseInt(upcomingResult.rows[0].disbursement_count) || 0
            },
            overdue: {
                amount: parseFloat(overdueResult.rows[0].total_amount) || 0,
                count: parseInt(overdueResult.rows[0].disbursement_count) || 0
            },
            future15Days: {
                amount: parseFloat(future15DaysResult.rows[0].total_amount) || 0,
                count: parseInt(future15DaysResult.rows[0].disbursement_count) || 0
            }
        };

        console.log('✅ Coordinator disbursement stats fetched:', {
            coordinatorId,
            stats
        });

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('❌ Error fetching coordinator disbursement stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching disbursement statistics',
            error: error.message
        });
    } finally {
        client.release();
    }
};


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
            search = ''
        } = req.query;

        // ✅ Define allowed columns for sorting
        const allowedSortBy = [
            'vendor_name', 'id', 'email', 'phone_number', 
            'created_at', 'wallet_balance', 'percentage', 'status'
        ];
        if (!allowedSortBy.includes(sortBy)) {
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

        const queryParams = [];
        // ✅ Base query to fetch all vendors with coordinator information
        let baseQuery = `
            FROM vendors v
            JOIN login l ON v.id = l.user_id
            LEFT JOIN wallet w ON v.id = w.id
            LEFT JOIN coordinator c ON v.coordinator_id = c.coordinator_id
            WHERE l.role = 'vendor'
        `;

        // ✅ Robust search across multiple relevant columns
        if (search) {
            queryParams.push(`%${search}%`);
            const searchIndex = queryParams.length;
            baseQuery += ` AND (v.vendor_name ILIKE $${searchIndex} OR v.id ILIKE $${searchIndex} OR v.email ILIKE $${searchIndex} OR v.phone_number ILIKE $${searchIndex} OR l.status ILIKE $${searchIndex} OR c.name ILIKE $${searchIndex})`;
        }
        
        // --- Get Total Count for Pagination ---
        const countQuery = `SELECT COUNT(*) ${baseQuery}`;
        const totalResult = await db.query(countQuery, queryParams);
        const totalCount = parseInt(totalResult.rows[0].count, 10);

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
        
        const dataResult = await db.query(dataQuery, [...queryParams, limit, offset]);

        console.log('✅ Coordinator vendors data fetched successfully:', {
            count: dataResult.rows.length,
            totalCount,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10)
        });

        res.status(200).json({
            data: dataResult.rows,
            totalCount,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            totalPages: Math.ceil(totalCount / limit)
        });

    } catch (error) {
        console.error('❌ Error fetching coordinator vendors:', error);
        res.status(500).json({ message: 'Failed to fetch vendors.' });
    }
};


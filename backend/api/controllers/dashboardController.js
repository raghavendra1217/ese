const db = require('../config/database');

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
 * Get dashboard statistics
 */
exports.getDashboardStats = async (req, res) => {
    const client = await db.connect();
    try {
        // Ensure disbursement tables exist
        await ensureDisbursementTables(client);
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        
        // Get start and end of current month
        const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
        const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);
        
        // Get start and end of next 15 days (including today)
        const startOf15Days = new Date();
        const endOf15Days = new Date();
        endOf15Days.setDate(startOf15Days.getDate() + 15);

        // Pending disbursements (due today)
        const thisMonthQuery = `
            SELECT 
                COALESCE(SUM(dd.disbursement_amount), 0) as total_amount,
                COUNT(*) as disbursement_count
            FROM disbursement_detail dd
            JOIN disbursement_schedules ds ON dd.schedule_id = ds.id
            WHERE dd.status = 'pending'
            AND DATE(dd.disbursement_date) = CURRENT_DATE
        `;

        // Total disbursed (all time) - count all paid disbursements
        const totalDisbursedQuery = `
            SELECT 
                COALESCE(SUM(disbursement_amount), 0) as total_amount,
                COUNT(*) as disbursement_count
            FROM disbursement_detail 
            WHERE status = 'paid'
        `;

        // Total invested (all time)
        const totalInvestedQuery = `
            SELECT 
                COALESCE(SUM(investment_amount), 0) as total_amount,
                COUNT(*) as investor_count
            FROM disbursement_schedules
        `;

        // All pending disbursements (due today)
        const pendingQuery = `
            SELECT 
                COALESCE(SUM(disbursement_amount), 0) as total_amount,
                COUNT(*) as disbursement_count
            FROM disbursement_detail 
            WHERE status = 'pending'
            AND DATE(disbursement_date) = CURRENT_DATE
        `;

        // Upcoming disbursements (future payments excluding today)
        const upcomingQuery = `
            SELECT 
                COALESCE(SUM(disbursement_amount), 0) as total_amount,
                COUNT(*) as disbursement_count
            FROM disbursement_detail 
            WHERE status = 'pending' 
            AND DATE(disbursement_date) > CURRENT_DATE
        `;

        // Overdue disbursements (yesterday and previous dates)
        const overdueQuery = `
            SELECT
                COALESCE(SUM(disbursement_amount), 0) as total_amount,
                COUNT(*) as disbursement_count
            FROM disbursement_detail
            WHERE status = 'pending'
            AND DATE(disbursement_date) < CURRENT_DATE
        `;

        // Future 15 days disbursements (including today)
        const future15DaysQuery = `
            SELECT
                COALESCE(SUM(disbursement_amount), 0) as total_amount,
                COUNT(*) as disbursement_count
            FROM disbursement_detail
            WHERE status = 'pending'
            AND DATE(disbursement_date) >= CURRENT_DATE
            AND DATE(disbursement_date) <= DATE($1)
        `;

        // Execute all queries
        const [
            thisMonthResult,
            totalDisbursedResult,
            totalInvestedResult,
            pendingResult,
            upcomingResult,
            overdueResult,
            future15DaysResult
        ] = await Promise.all([
            client.query(thisMonthQuery),
            client.query(totalDisbursedQuery),
            client.query(totalInvestedQuery),
            client.query(pendingQuery),
            client.query(upcomingQuery),
            client.query(overdueQuery),
            client.query(future15DaysQuery, [endOf15Days])
        ]);

        const stats = {
            thisMonth: {
                amount: parseFloat(thisMonthResult.rows[0].total_amount) || 0,
                count: parseInt(thisMonthResult.rows[0].disbursement_count) || 0
            },
            totalDisbursed: {
                amount: parseFloat(totalDisbursedResult.rows[0].total_amount) || 0,
                count: parseInt(totalDisbursedResult.rows[0].disbursement_count) || 0
            },
            totalInvested: {
                amount: parseFloat(totalInvestedResult.rows[0].total_amount) || 0,
                count: parseInt(totalInvestedResult.rows[0].investor_count) || 0
            },
            pending: {
                amount: parseFloat(pendingResult.rows[0].total_amount) || 0,
                count: parseInt(pendingResult.rows[0].disbursement_count) || 0
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

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard statistics',
            error: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * Get all disbursements with filters
 */
exports.getAllDisbursements = async (req, res) => {
    const client = await db.connect();
    try {
        // Ensure disbursement tables exist
        await ensureDisbursementTables(client);
        const { 
            status, 
            startDate, 
            endDate, 
            investorId, 
            coordinator,
            planType,
            page = 1,
            limit = 50
        } = req.query;

        let whereConditions = [];
        let queryParams = [];
        let paramCount = 0;

        // Build dynamic WHERE clause
        if (status) {
            if (status === 'overdue') {
                // Overdue means pending disbursements with past dates
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

        if (investorId) {
            paramCount++;
            whereConditions.push(`ds.investor_id = $${paramCount}`);
            queryParams.push(investorId);
        }

        if (coordinator) {
            paramCount++;
            whereConditions.push(`i.coordinator ILIKE $${paramCount}`);
            queryParams.push(`%${coordinator}%`);
        }

        if (planType) {
            paramCount++;
            whereConditions.push(`i.plan_type = $${paramCount}`);
            queryParams.push(planType);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Main query
        const mainQuery = `
            SELECT 
                dd.id,
                dd.disbursement_number,
                dd.disbursement_date,
                dd.disbursement_amount,
                dd.status,
                dd.paid_date,
                dd.payment_reference,
                dd.notes,
                ds.investor_id,
                ds.investment_amount,
                ds.total_return,
                i.first_name,
                i.mobile_number,
                i.coordinator,
                i.plan_type,
                i.select_plan
            FROM disbursement_detail dd
            JOIN disbursement_schedules ds ON dd.schedule_id = ds.id
            JOIN investordetails i ON ds.investor_id = i.id
            ${whereClause}
            ORDER BY dd.disbursement_date ASC, dd.disbursement_number ASC
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `;

        // Count query for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM disbursement_detail dd
            JOIN disbursement_schedules ds ON dd.schedule_id = ds.id
            JOIN investordetails i ON ds.investor_id = i.id
            ${whereClause}
        `;

        // Add pagination parameters
        const offset = (page - 1) * limit;
        queryParams.push(limit, offset);

        const [disbursementsResult, countResult] = await Promise.all([
            client.query(mainQuery, queryParams),
            client.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
        ]);

        const totalCount = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(totalCount / limit);

        res.json({
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
        console.error('Error fetching disbursements:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching disbursements',
            error: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * Update disbursement status
 */
exports.updateDisbursementStatus = async (req, res) => {
    const client = await db.connect();
    try {
        const { id } = req.params;
        const disbursementId = parseInt(id); // Ensure it's a number
        const { status, paymentReference, notes } = req.body;

        console.log(`🔄 Updating disbursement ${disbursementId} with status: ${status}`);
        console.log(`📝 Request body:`, req.body);
        console.log(`🔢 Parsed ID: ${disbursementId} (type: ${typeof disbursementId})`);

        // Ensure disbursement tables exist
        await ensureDisbursementTables(client);

        // Check if disbursement exists first
        const checkQuery = `SELECT id, status FROM disbursement_detail WHERE id = $1`;
        console.log(`🔍 Checking if disbursement ${disbursementId} exists...`);
        const { rows: existingRows } = await client.query(checkQuery, [disbursementId]);

        if (existingRows.length === 0) {
            console.log(`❌ Disbursement ${disbursementId} not found in database`);

            // Let's also check if the table exists and has any data
            const tableCheck = await client.query(`
                SELECT COUNT(*) as count FROM disbursement_detail
            `);
            console.log(`📊 Total disbursements in database: ${tableCheck.rows[0].count}`);

            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Disbursement not found'
            });
        }

        console.log(`✅ Found disbursement ${disbursementId} with current status: ${existingRows[0].status}`);

        if (!status || !['pending', 'paid', 'overdue'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be pending, paid, or overdue'
            });
        }

        const updateQuery = `
            UPDATE disbursement_detail
            SET
                status = $1::VARCHAR(20),
                paid_date = CASE WHEN $1::VARCHAR(20) = 'paid' AND paid_date IS NULL THEN CURRENT_DATE ELSE paid_date END,
                payment_reference = COALESCE($2, payment_reference),
                notes = COALESCE($3, notes),
                updated_at = NOW()
            WHERE id = $4
            RETURNING *
        `;

        console.log(`🔄 Executing update query for disbursement ${disbursementId}`);
        const { rows } = await client.query(updateQuery, [status, paymentReference, notes, disbursementId]);
        console.log(`✅ Update query executed successfully, rows affected: ${rows.length}`);

        if (rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Disbursement not found'
            });
        }

        await client.query('COMMIT');
        res.json({
            success: true,
            message: 'Disbursement status updated successfully',
            data: rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error updating disbursement status:', error);
        console.error('❌ Error details:', {
            message: error.message,
            code: error.code,
            severity: error.severity,
            detail: error.detail,
            hint: error.hint,
            position: error.position,
            internalPosition: error.internalPosition,
            internalQuery: error.internalQuery,
            where: error.where,
            schema: error.schema,
            table: error.table,
            column: error.column,
            dataType: error.dataType,
            constraint: error.constraint,
            file: error.file,
            line: error.line,
            routine: error.routine,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Error updating disbursement status',
            error: error.message,
            details: error.detail || 'No additional details'
        });
    } finally {
        client.release();
    }
};

/**
 * Get disbursement details by ID
 */
exports.getDisbursementById = async (req, res) => {
    const client = await db.connect();
    try {
        const { id } = req.params;

        // Ensure disbursement tables exist
        await ensureDisbursementTables(client);

        const query = `
            SELECT 
                dd.*,
                ds.investment_amount,
                ds.total_return,
                ds.duration_days,
                ds.interval_days,
                ds.num_disbursements,
                i.first_name,
                i.mobile_number,
                i.coordinator,
                i.plan_type,
                i.select_plan
            FROM disbursement_detail dd
            JOIN disbursement_schedules ds ON dd.schedule_id = ds.id
            JOIN investordetails i ON ds.investor_id = i.id
            WHERE dd.id = $1
        `;

        const { rows } = await client.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Disbursement not found'
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        console.error('Error fetching disbursement:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching disbursement details',
            error: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * Get upcoming disbursements (next 7 days)
 */
exports.getUpcomingDisbursements = async (req, res) => {
    const client = await db.connect();
    try {
        // Ensure disbursement tables exist
        await ensureDisbursementTables(client);
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 7);

        const query = `
            SELECT 
                dd.id,
                dd.disbursement_number,
                dd.disbursement_date,
                dd.disbursement_amount,
                dd.status,
                i.first_name,
                i.mobile_number,
                i.coordinator,
                i.plan_type,
                i.select_plan,
                i.approval_status
            FROM disbursement_detail dd
            JOIN disbursement_schedules ds ON dd.schedule_id = ds.id
            JOIN investordetails i ON ds.investor_id = i.id
            WHERE dd.status = 'pending' 
            AND dd.disbursement_date >= $1 
            AND dd.disbursement_date <= $2
            AND i.approval_status = 'approved'
            ORDER BY dd.disbursement_date ASC, dd.disbursement_number ASC
        `;

        const { rows } = await client.query(query, [startDate, endDate]);

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error('Error fetching upcoming disbursements:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching upcoming disbursements',
            error: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * Get overdue disbursements
 */
exports.getOverdueDisbursements = async (req, res) => {
    const client = await db.connect();
    try {
        // Ensure disbursement tables exist
        await ensureDisbursementTables(client);
        const query = `
            SELECT 
                dd.id,
                dd.disbursement_number,
                dd.disbursement_date,
                dd.disbursement_amount,
                dd.status,
                i.first_name,
                i.mobile_number,
                i.coordinator,
                i.plan_type,
                i.select_plan,
                i.approval_status,
                CURRENT_DATE - dd.disbursement_date as days_overdue
            FROM disbursement_detail dd
            JOIN disbursement_schedules ds ON dd.schedule_id = ds.id
            JOIN investordetails i ON ds.investor_id = i.id
            WHERE dd.status = 'pending' 
            AND dd.disbursement_date < CURRENT_DATE
            AND i.approval_status = 'approved'
            ORDER BY dd.disbursement_date ASC, dd.disbursement_number ASC
        `;

        const { rows } = await client.query(query);

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error('Error fetching overdue disbursements:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching overdue disbursements',
            error: error.message
        });
    } finally {
        client.release();
    }
};

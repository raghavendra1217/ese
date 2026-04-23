const db = require('../config/database');

// Create payslip
exports.createPayslip = async (req, res) => {
    const {
        employee_id,
        employee_name,
        designation,
        month,
        year,
        basic_salary,
        total_working_days,
        provident_fund,
        esi,
        da,
        professional_tax,
        hra,
        other_deductions,
        ta,
        total_addition,
        total_deductions,
        salary_paid_by
    } = req.body;

    const client = await db.connect();
    
    try {
        // Validate required fields
        if (!employee_id || !employee_name || !designation || !month || !year || !basic_salary || !total_working_days || !salary_paid_by) {
            return res.status(400).json({
                message: 'Missing required fields'
            });
        }

        const query = `
            INSERT INTO payslips (
                employee_id, employee_name, designation, month, year, basic_salary, 
                total_working_days, provident_fund, esi, da, professional_tax, 
                hra, other_deductions, ta, total_addition, total_deductions, salary_paid_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING *
        `;

        const values = [
            employee_id, employee_name, designation, month, year, basic_salary,
            total_working_days, provident_fund || 0, esi || 0, da || 0, professional_tax || 0,
            hra || 0, other_deductions || 0, ta || 0, total_addition || 0, total_deductions || 0, salary_paid_by
        ];

        const result = await client.query(query, values);
        
        res.status(201).json({
            message: 'Payslip created successfully',
            payslip: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating payslip:', error);
        res.status(500).json({
            message: 'Failed to create payslip',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Get all payslips (admin)
exports.getAllPayslips = async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const client = await db.connect();
    
    try {
        let query = `
            SELECT * FROM payslips
        `;
        let countQuery = `SELECT COUNT(*) as total FROM payslips`;
        let queryParams = [];
        let paramCount = 0;

        // Add search functionality
        if (search) {
            paramCount++;
            const searchCondition = `WHERE employee_id ILIKE $${paramCount} OR employee_name ILIKE $${paramCount} OR designation ILIKE $${paramCount}`;
            query += ` ${searchCondition}`;
            countQuery += ` ${searchCondition}`;
            queryParams.push(`%${search}%`);
        }

        // Add ordering and pagination
        query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        queryParams.push(parseInt(limit), offset);

        const [payslipsResult, countResult] = await Promise.all([
            client.query(query, queryParams),
            client.query(countQuery, queryParams.slice(0, paramCount))
        ]);

        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limit);

        res.json({
            data: payslipsResult.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalRecords: total,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching payslips:', error);
        res.status(500).json({
            message: 'Failed to fetch payslips',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Get payslip by ID
exports.getPayslipById = async (req, res) => {
    const { id } = req.params;

    const client = await db.connect();
    
    try {
        const query = `SELECT * FROM payslips WHERE id = $1`;
        const result = await client.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Payslip not found'
            });
        }

        res.json({
            payslip: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching payslip:', error);
        res.status(500).json({
            message: 'Failed to fetch payslip',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Update payslip
exports.updatePayslip = async (req, res) => {
    const { id } = req.params;
    const {
        employee_id,
        employee_name,
        designation,
        month,
        year,
        basic_salary,
        total_working_days,
        provident_fund,
        esi,
        da,
        professional_tax,
        hra,
        other_deductions,
        ta,
        total_addition,
        total_deductions,
        salary_paid_by
    } = req.body;

    const client = await db.connect();
    
    try {
        // Validate required fields
        if (!employee_id || !employee_name || !designation || !month || !year || !basic_salary || !total_working_days || !salary_paid_by) {
            return res.status(400).json({
                message: 'Missing required fields'
            });
        }

        const query = `
            UPDATE payslips SET
                employee_id = $1,
                employee_name = $2,
                designation = $3,
                month = $4,
                year = $5,
                basic_salary = $6,
                total_working_days = $7,
                provident_fund = $8,
                esi = $9,
                da = $10,
                professional_tax = $11,
                hra = $12,
                other_deductions = $13,
                ta = $14,
                total_addition = $15,
                total_deductions = $16,
                salary_paid_by = $17,
                updated_at = NOW()
            WHERE id = $18
            RETURNING *
        `;

        const values = [
            employee_id, employee_name, designation, month, year, basic_salary,
            total_working_days, provident_fund || 0, esi || 0, da || 0, professional_tax || 0,
            hra || 0, other_deductions || 0, ta || 0, total_addition || 0, total_deductions || 0, salary_paid_by, id
        ];

        const result = await client.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Payslip not found'
            });
        }

        res.json({
            message: 'Payslip updated successfully',
            payslip: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating payslip:', error);
        res.status(500).json({
            message: 'Failed to update payslip',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Delete payslip
exports.deletePayslip = async (req, res) => {
    const { id } = req.params;

    const client = await db.connect();
    
    try {
        const query = `DELETE FROM payslips WHERE id = $1 RETURNING *`;
        const result = await client.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Payslip not found'
            });
        }

        res.json({
            message: 'Payslip deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting payslip:', error);
        res.status(500).json({
            message: 'Failed to delete payslip',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Get payslip statistics
exports.getPayslipStats = async (req, res) => {
    const client = await db.connect();
    
    try {
        const queries = [
            // Total payslips
            `SELECT COUNT(*) as total FROM payslips`,
            // This month's payslips
            `SELECT COUNT(*) as this_month FROM payslips WHERE month = $1 AND year = $2`,
            // This year's payslips
            `SELECT COUNT(*) as this_year FROM payslips WHERE year = $3`,
            // Total salary paid this month
            `SELECT COALESCE(SUM(basic_salary + total_addition - total_deductions), 0) as total_salary_this_month FROM payslips WHERE month = $1 AND year = $2`
        ];

        const currentDate = new Date();
        const currentMonth = currentDate.toLocaleString('default', { month: 'short' }).toUpperCase();
        const currentYear = currentDate.getFullYear();

        const [totalResult, monthResult, yearResult, salaryResult] = await Promise.all([
            client.query(queries[0]),
            client.query(queries[1], [currentMonth, currentYear]),
            client.query(queries[2], [currentYear]),
            client.query(queries[3], [currentMonth, currentYear])
        ]);

        res.json({
            total_payslips: parseInt(totalResult.rows[0].total),
            this_month_payslips: parseInt(monthResult.rows[0].this_month),
            this_year_payslips: parseInt(yearResult.rows[0].this_year),
            total_salary_this_month: parseFloat(salaryResult.rows[0].total_salary_this_month)
        });
    } catch (error) {
        console.error('Error fetching payslip stats:', error);
        res.status(500).json({
            message: 'Failed to fetch payslip statistics',
            error: error.message
        });
    } finally {
        client.release();
    }
};

const db = require('../config/database');

// Create a new quick registration
exports.createQuickRegistration = async (req, res) => {
    const { name, phone, address, comments, follow_up_date } = req.body;

    // Validate required fields
    if (!name || !phone || !address) {
        return res.status(400).json({
            message: 'Name, phone, and address are required fields.'
        });
    }

    const client = await db.connect();
    try {
        const result = await client.query(
            `INSERT INTO quick_reg (name, phone, address, comments, follow_up_date)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, name, phone, address, comments, follow_up_date, created_on`,
            [name, phone, address, comments || null, follow_up_date || null]
        );

        res.status(201).json({
            message: 'Quick registration created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating quick registration:', error);
        res.status(500).json({
            message: 'Failed to create quick registration',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Get all quick registrations (for admin)
exports.getAllQuickRegistrations = async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const client = await db.connect();
    try {
        let query = `
            SELECT id, name, phone, address, comments, follow_up_date, created_on
            FROM quick_reg
        `;
        let countQuery = `SELECT COUNT(*) as total FROM quick_reg`;
        let queryParams = [];
        let paramCount = 0;

        // Add search functionality
        if (search) {
            paramCount++;
            const searchCondition = `WHERE name ILIKE $${paramCount} OR phone ILIKE $${paramCount} OR address ILIKE $${paramCount}`;
            query += ` ${searchCondition}`;
            countQuery += ` ${searchCondition}`;
            queryParams.push(`%${search}%`);
        }

        // Add ordering and pagination
        query += ` ORDER BY created_on DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        queryParams.push(parseInt(limit), offset);

        const [registrationsResult, countResult] = await Promise.all([
            client.query(query, queryParams),
            client.query(countQuery, queryParams.slice(0, paramCount))
        ]);

        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limit);

        res.json({
            data: registrationsResult.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalRecords: total,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching quick registrations:', error);
        res.status(500).json({ 
            message: 'Failed to fetch quick registrations',
            error: error.message 
        });
    } finally {
        client.release();
    }
};

// Get quick registration by ID
exports.getQuickRegistrationById = async (req, res) => {
    const { id } = req.params;

    const client = await db.connect();
    try {
        const result = await client.query(
            `SELECT id, name, phone, address, comments, follow_up_date, created_on
             FROM quick_reg WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                message: 'Quick registration not found' 
            });
        }

        res.json({
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching quick registration:', error);
        res.status(500).json({ 
            message: 'Failed to fetch quick registration',
            error: error.message 
        });
    } finally {
        client.release();
    }
};

// Update quick registration
exports.updateQuickRegistration = async (req, res) => {
    const { id } = req.params;
    const { name, phone, address, comments, follow_up_date } = req.body;

    // Validate required fields
    if (!name || !phone || !address) {
        return res.status(400).json({
            message: 'Name, phone, and address are required fields.'
        });
    }

    const client = await db.connect();
    try {
        const result = await client.query(
            `UPDATE quick_reg
             SET name = $1, phone = $2, address = $3, comments = $4, follow_up_date = $5
             WHERE id = $6
             RETURNING id, name, phone, address, comments, follow_up_date, created_on`,
            [name, phone, address, comments || null, follow_up_date || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Quick registration not found'
            });
        }

        res.json({
            message: 'Quick registration updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating quick registration:', error);
        res.status(500).json({
            message: 'Failed to update quick registration',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Delete quick registration
exports.deleteQuickRegistration = async (req, res) => {
    const { id } = req.params;

    const client = await db.connect();
    try {
        const result = await client.query(
            'DELETE FROM quick_reg WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Quick registration not found'
            });
        }

        res.json({
            message: 'Quick registration deleted successfully',
            deletedId: result.rows[0].id
        });
    } catch (error) {
        console.error('Error deleting quick registration:', error);
        res.status(500).json({
            message: 'Failed to delete quick registration',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Get quick registration statistics
exports.getQuickRegistrationStats = async (req, res) => {
    const client = await db.connect();
    try {
        const result = await client.query(`
            SELECT 
                COUNT(*) as total_registrations,
                COUNT(CASE WHEN created_on >= CURRENT_DATE THEN 1 END) as today_registrations,
                COUNT(CASE WHEN created_on >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_registrations,
                COUNT(CASE WHEN created_on >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as month_registrations
            FROM quick_reg
        `);

        res.json({
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching quick registration stats:', error);
        res.status(500).json({ 
            message: 'Failed to fetch quick registration statistics',
            error: error.message 
        });
    } finally {
        client.release();
    }
};

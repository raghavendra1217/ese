// backend/api/controllers/investorController.js

const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { calculateDisbursementSchedule, createDisbursementSchedule, getDisbursementSchedule } = require('../utils/disbursementCalculator');

/**
 * Add a new investor
 */
exports.addInvestor = async (req, res) => {
    const {
        first_name,
        mobile_number,
        pan_card,
        coordinator,
        co_name,
        bank_account_number,
        bank_name,
        branch_name,
        ifsc_code,
        mode_of_payment,
        plan_type,
        select_plan,
        transaction_id,
        address,
        investment_date
    } = req.body;

    // Validate required fields
    if (!first_name || !mobile_number) {
        return res.status(400).json({ 
            message: 'First name and mobile number are required.' 
        });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Generate custom investor ID in NG_0001 format
        const getNextInvestorId = async () => {
            const countQuery = 'SELECT COUNT(*) as count FROM investordetails';
            const { rows } = await client.query(countQuery);
            const count = parseInt(rows[0].count) + 1;
            return `NG_${String(count).padStart(4, '0')}`;
        };

        const customId = await getNextInvestorId();

        const query = `
            INSERT INTO investordetails (
                id, first_name, mobile_number, pan_card, coordinator, co_name,
                bank_account_number, bank_name, branch_name, ifsc_code, mode_of_payment,
                plan_type, select_plan, transaction_id,
                address, investment_date, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
            RETURNING *;
        `;
        
        const params = [
            customId, first_name, mobile_number, pan_card, coordinator, co_name,
            bank_account_number, bank_name, branch_name, ifsc_code, mode_of_payment,
            plan_type, select_plan, transaction_id,
            address, investment_date
        ];
        
        const { rows } = await client.query(query, params);
        const newInvestor = rows[0];

        // Calculate and create disbursement schedule
        try {
            const investmentAmount = select_plan === '50k' ? 50000 : 100000;
            const scheduleData = calculateDisbursementSchedule({
                investmentAmount,
                selectPlan: select_plan,
                planType: plan_type || '60 days',
                investmentDate: investment_date || new Date()
            });

            await createDisbursementSchedule(db, scheduleData, newInvestor.id);
            console.log(`✅ Created disbursement schedule for investor ${newInvestor.id}`);
        } catch (scheduleError) {
            console.error('Error creating disbursement schedule:', scheduleError);
            // Don't fail the investor creation if schedule creation fails
        }

        await client.query('COMMIT');
        
        console.log(`✅ Investor added successfully: ${newInvestor.id}`);
        res.status(201).json({
            message: 'Investor added successfully.',
            investor: newInvestor
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding investor:', error);
        res.status(500).json({ message: 'Failed to add investor.' });
    } finally {
        client.release();
    }
};

/**
 * Get all investors
 */
exports.getAllInvestors = async (req, res) => {
    try {
        const query = 'SELECT * FROM investordetails ORDER BY created_at DESC';
        const { rows } = await db.query(query);
        
        console.log(`🔍 Investors fetched: ${rows.length} investors`);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching investors:', error);
        res.status(500).json({ message: 'Failed to fetch investors.' });
    }
};

/**
 * Get investor by ID
 */
exports.getInvestorById = async (req, res) => {
    const { id } = req.params;
    
    try {
        const query = 'SELECT * FROM investordetails WHERE id = $1';
        const { rows } = await db.query(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Investor not found.' });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching investor:', error);
        res.status(500).json({ message: 'Failed to fetch investor.' });
    }
};

/**
 * Update investor
 */
exports.updateInvestor = async (req, res) => {
    const { id } = req.params;
    const {
        first_name,
        mobile_number,
        pan_card,
        coordinator,
        co_name,
        bank_account_number,
        bank_name,
        branch_name,
        ifsc_code,
        mode_of_payment,
        plan_type,
        select_plan,
        transaction_id,
        address,
        investment_date
    } = req.body;

    try {
        const query = `
            UPDATE investordetails 
            SET first_name = $1, mobile_number = $2, pan_card = $3, coordinator = $4,
                co_name = $5, bank_account_number = $6, bank_name = $7, branch_name = $8, ifsc_code = $9,
                mode_of_payment = $10, plan_type = $11, select_plan = $12,
                transaction_id = $13, address = $14,
                investment_date = $15, updated_at = NOW()
            WHERE id = $16
            RETURNING *;
        `;
        
        const params = [
            first_name, mobile_number, pan_card, coordinator, co_name,
            bank_account_number, bank_name, branch_name, ifsc_code, mode_of_payment,
            plan_type, select_plan, transaction_id,
            address, investment_date, id
        ];
        
        const { rows } = await db.query(query, params);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Investor not found.' });
        }
        
        console.log(`✅ Investor updated successfully: ${id}`);
        res.json({
            message: 'Investor updated successfully.',
            investor: rows[0]
        });
    } catch (error) {
        console.error('Error updating investor:', error);
        res.status(500).json({ message: 'Failed to update investor.' });
    }
};

/**
 * Delete investor
 */
exports.deleteInvestor = async (req, res) => {
    const { id } = req.params;
    
    try {
        const query = 'DELETE FROM investordetails WHERE id = $1 RETURNING *';
        const { rows } = await db.query(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Investor not found.' });
        }
        
        console.log(`✅ Investor deleted successfully: ${id}`);
        res.json({ message: 'Investor deleted successfully.' });
    } catch (error) {
        console.error('Error deleting investor:', error);
        res.status(500).json({ message: 'Failed to delete investor.' });
    }
};

/**
 * Get investor statistics
 */
exports.getInvestorStats = async (req, res) => {
    try {
        const query = `
            SELECT 
                COUNT(*) as total_investors,
                COUNT(CASE WHEN select_plan = '50k' THEN 1 END) as plan_50k_count,
                COUNT(CASE WHEN select_plan = '1 lakh' THEN 1 END) as plan_1lakh_count,
                SUM(CASE WHEN select_plan = '50k' THEN 50000 ELSE 100000 END) as total_investment
            FROM investordetails;
        `;
        
        const { rows } = await db.query(query);
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching investor stats:', error);
        res.status(500).json({ message: 'Failed to fetch investor statistics.' });
    }
};

/**
 * Get disbursement schedule for an investor
 */
exports.getDisbursementSchedule = async (req, res) => {
    const { id } = req.params;
    
    try {
        const schedule = await getDisbursementSchedule(db, id);
        
        if (!schedule) {
            return res.status(404).json({ message: 'Disbursement schedule not found.' });
        }
        
        res.json(schedule);
    } catch (error) {
        console.error('Error fetching disbursement schedule:', error);
        res.status(500).json({ message: 'Failed to fetch disbursement schedule.' });
    }
};

/**
 * Get all disbursement schedules
 */
exports.getAllDisbursementSchedules = async (req, res) => {
    try {
        const query = `
            SELECT ds.*, i.first_name, i.mobile_number, i.select_plan
            FROM disbursement_schedules ds
            JOIN investordetails i ON ds.investor_id = i.id
            ORDER BY ds.created_at DESC;
        `;
        
        const { rows } = await db.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching disbursement schedules:', error);
        res.status(500).json({ message: 'Failed to fetch disbursement schedules.' });
    }
};

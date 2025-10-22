const db = require('../config/database');
const { formatTimestampsForDisplay } = require('../utils/timeUtils');

const getAllTransactions = async (req, res) => {
    try {
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

        const allowedSortBy = [
            'trans_id', 'created_at', 'user_id', 'vendor_name', 'balance_after_transaction',
            'transaction_type', 'amount', 'status', 'description'
        ];
        if (!allowedSortBy.includes(sortBy)) {
            return res.status(400).json({ message: 'Invalid sort column.' });
        }
        const sortColumn = sortBy === 'vendor_name' ? 'v.vendor_name' : `t.${sortBy}`;
        const sanitizedSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

        const queryParams = [];
        let baseQuery = `
            FROM transaction t 
            LEFT JOIN vendors v ON t.user_id = v.id 
            WHERE 1=1
        `;

        // ✅ Updated search to include phone_number and description
        if (search) {
            queryParams.push(`%${search}%`);
            const searchIndex = queryParams.length;
            baseQuery += ` AND (t.user_id ILIKE $${searchIndex} OR t.upi_transaction_id ILIKE $${searchIndex} OR t.description ILIKE $${searchIndex} OR v.vendor_name ILIKE $${searchIndex} OR v.email ILIKE $${searchIndex} OR v.phone_number ILIKE $${searchIndex})`;
        }

        if (transaction_type) {
            queryParams.push(transaction_type);
            baseQuery += ` AND t.transaction_type = $${queryParams.length}`;
        }

        if (startDate) {
            queryParams.push(startDate);
            baseQuery += ` AND t.created_at >= $${queryParams.length}`;
        }
        if (endDate) {
            queryParams.push(endDate);
            baseQuery += ` AND t.created_at < ($${queryParams.length}::date + interval '1 day')`;
        }
        
        const countQuery = `SELECT COUNT(*) ${baseQuery}`;
        const totalResult = await db.query(countQuery, queryParams);
        const totalCount = parseInt(totalResult.rows[0].count, 10);

        const offset = (page - 1) * limit;
        
        // ✅ Updated SELECT statement to convert UTC to IST and include all fields
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

        // ✅ Process the results to format the IST time properly using backend conversion
        const processedData = dataResult.rows.map(row => formatTimestampsForDisplay(row, ['created_at']));

        res.status(200).json({
            data: processedData,
            totalCount,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            totalPages: Math.ceil(totalCount / limit)
        });

    } catch (error) {
        console.error('❌ Error fetching transactions for table:', error);
        res.status(500).json({ message: 'Server error while fetching transactions.' });
    }
};

module.exports = {
    getAllTransactions,
};
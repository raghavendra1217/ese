const db = require('../config/database');
const axios = require('axios');
const { formatTimestampsForDisplay, formatDatesForDisplay } = require('../utils/timeUtils');

/**
 * Get basic transaction list with pagination
 * Returns: transaction_id, created_at (IST), vendor_id, vendor_name, transaction_type, amount
 * Sorted by transaction_id in ascending order
 * Includes: withdrawal, deposit, and registration_fee transactions (approved only)
 */
const getTransactionList = async (req, res) => {
    try {
        const { range = '1,10' } = req.query;
        
        // Parse range parameter: "start,count" or just "start"
        const rangeParts = range.split(',');
        let start = parseInt(rangeParts[0], 10);
        let count = parseInt(rangeParts[1], 10);
        
        // Handle edge cases
        if (isNaN(start)) {
            return res.status(400).json({ message: 'Invalid range format. Use: start,count or just start' });
        }
        
        // Convert 0 to 1 (index starts from 1)
        if (start === 0) start = 1;
        
        // Validate start
        if (start < 1) {
            return res.status(400).json({ message: 'Start must be a positive number' });
        }
        
        // If count is not provided or invalid, get all rows from start to end
        if (isNaN(count) || count < 1) {
            count = null; // This will be handled in the query
        }
        
        // Calculate offset (convert to 0-based for SQL)
        const offset = start - 1;
        
        // Get total count of approved withdrawal, deposit, and registration_fee transactions
        const totalCountQuery = `SELECT COUNT(*) as total FROM transaction 
                                 WHERE status = 'approved' 
                                 AND transaction_type IN ('withdrawal', 'deposit', 'registration_fee')`;
        const totalCountResult = await db.query(totalCountQuery);
        const totalRows = parseInt(totalCountResult.rows[0].total, 10);
        
        // Query to get transactions with vendor info and amount (only approved withdrawals, deposits, and registration_fees)
        let query, queryParams;
        
        if (count) {
            // If count is specified, use LIMIT and OFFSET
            query = `
                SELECT 
                    t.trans_id as transaction_id,
                    t.created_at as created_at,
                    t.user_id as vendor_id,
                    v.vendor_name,
                    t.transaction_type,
                    t.amount
                FROM transaction t 
                LEFT JOIN vendors v ON t.user_id = v.id 
                WHERE t.status = 'approved' 
                AND t.transaction_type IN ('withdrawal', 'deposit', 'registration_fee')
                ORDER BY t.trans_id ASC
                LIMIT $1 OFFSET $2
            `;
            queryParams = [count, offset];
        } else {
            // If no count specified, get all rows from start to end
            query = `
                SELECT 
                    t.trans_id as transaction_id,
                    t.created_at as created_at,
                    t.user_id as vendor_id,
                    v.vendor_name,
                    t.transaction_type,
                    t.amount
                FROM transaction t 
                LEFT JOIN vendors v ON t.user_id = v.id 
                WHERE t.status = 'approved' 
                AND t.transaction_type IN ('withdrawal', 'deposit', 'registration_fee')
                ORDER BY t.trans_id ASC
                OFFSET $1
            `;
            queryParams = [offset];
        }
        
        const result = await db.query(query, queryParams);

        // Data already includes transaction_id from the query
        const data = result.rows;

        // Convert timestamps to IST for frontend display
        const formattedData = data.map(row => formatTimestampsForDisplay(row, ['created_at']));

        res.status(200).json({
            success: true,
            data: formattedData,
            pagination: {
                start: start,
                count: count || 'all',
                returned: result.rows.length,
                total: totalRows
            }
        });
        
    } catch (error) {
        console.error('❌ Error fetching transaction list:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error while fetching transactions' 
        });
    }
};

/**
 * Get transaction summary information
 * Returns: total_transactions, last_transaction_id, last_transaction_time
 * Includes: withdrawal, deposit, and registration_fee transactions (approved only)
 */
const getTransactionSummary = async (req, res) => {
    try {
        // Query to get transaction summary (only approved withdrawals, deposits, and registration_fees)
        const query = `
            SELECT 
                COUNT(*) as total_transactions,
                MAX(t.trans_id) as last_transaction_id,
                MAX(t.created_at) as last_transaction_time
            FROM transaction t
            WHERE t.status = 'approved' 
            AND t.transaction_type IN ('withdrawal', 'deposit', 'registration_fee')
        `;
        
        const result = await db.query(query);
        const summary = result.rows[0];
        
        res.status(200).json({
            success: true,
            data: {
                total_transactions: parseInt(summary.total_transactions, 10),
                last_transaction_id: summary.last_transaction_id,
                last_transaction_time: summary.last_transaction_time
            }
        });
        
    } catch (error) {
        console.error('❌ Error fetching transaction summary:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error while fetching transaction summary' 
        });
    }
};

/**
 * Send transaction data to external API
 * Maps database fields to API payload format
 */
const sendTransactionToExternalAPI = async (transactionData) => {
    try {
        const payload = {
            id: 0,
            ese_txn_id: transactionData.transaction_id,
            joinDate: transactionData.created_at,
            vendorId: transactionData.vendor_id,
            vendorName: transactionData.vendor_name,
            cash_Bank_Flag: "B", // Default value
            bank_Name: "-", // Default value
            txn_Type: transactionData.transaction_type || "unknown", // Default to purchase if not specified
            bank_Id: 0, // Default value
            approval: true, // Default value
            created_Date: null, // Will be set by external API
            created_By: 0, // Default value
            amount: transactionData.amount,
            bankName: "-" // Default value
        };

        console.log('📤 Sending transaction to external API:', {
            transaction_id: transactionData.transaction_id,
            vendor_id: transactionData.vendor_id,
            amount: transactionData.amount
        });

        const response = await axios.post('https://healthapi.nginfosolutions.com/create_easypaper_tran', payload, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
        });

        console.log('✅ Transaction sent successfully to external API:', {
            transaction_id: transactionData.transaction_id,
            status: response.status,
            response_data: response.data
        });

        return {
            success: true,
            status: response.status,
            data: response.data
        };

    } catch (error) {
        console.error('❌ Error sending transaction to external API:', {
            transaction_id: transactionData.transaction_id,
            error: error.message,
            response: error.response?.data || 'No response data'
        });

        return {
            success: false,
            error: error.message,
            status: error.response?.status || 'No status'
        };
    }
};

/**
 * Get transaction and send to external API
 * This function can be called whenever a transaction is created/updated
 */
const processTransactionAndSendToAPI = async (req, res) => {
    try {
        const { transaction_id } = req.params;
        
        if (!transaction_id) {
            return res.status(400).json({
                success: false,
                message: 'Transaction ID is required'
            });
        }

        // Get transaction data from database (only approved withdrawals, deposits, and registration_fees)
        const query = `
            SELECT 
                t.trans_id as transaction_id,
                (t.created_at AT TIME ZONE 'Asia/Kolkata') as created_at,
                t.user_id as vendor_id,
                v.vendor_name,
                t.transaction_type,
                t.amount
            FROM transaction t 
            LEFT JOIN vendors v ON t.user_id = v.id 
            WHERE t.trans_id = $1
            AND t.status = 'approved' 
            AND t.transaction_type IN ('withdrawal', 'deposit', 'registration_fee')
        `;
        
        const result = await db.query(query, [transaction_id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        const transactionData = result.rows[0];
        
        // Send to external API
        const apiResult = await sendTransactionToExternalAPI(transactionData);
        
        res.status(200).json({
            success: true,
            transaction_data: transactionData,
            api_result: apiResult
        });
        
    } catch (error) {
        console.error('❌ Error processing transaction for API:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error while processing transaction'
        });
    }
};

/**
 * Send all transactions to external API (for bulk processing)
 */
const sendAllTransactionsToAPI = async (req, res) => {
    try {
        // Get all approved withdrawal, deposit, and registration_fee transactions from database
        const query = `
            SELECT 
                t.trans_id as transaction_id,
                (t.created_at AT TIME ZONE 'Asia/Kolkata') as created_at,
                t.user_id as vendor_id,
                v.vendor_name,
                t.transaction_type,
                t.amount
            FROM transaction t 
            LEFT JOIN vendors v ON t.user_id = v.id 
            WHERE t.status = 'approved' 
            AND t.transaction_type IN ('withdrawal', 'deposit', 'registration_fee')
            ORDER BY t.trans_id ASC
        `;
        
        const result = await db.query(query);
        const transactions = result.rows;
        
        if (transactions.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No transactions found',
                total_processed: 0
            });
        }

        console.log(`📤 Processing ${transactions.length} transactions for external API...`);
        
        const results = [];
        let successCount = 0;
        let failureCount = 0;

        // Process each transaction sequentially to avoid overwhelming the external API
        for (const transaction of transactions) {
            const apiResult = await sendTransactionToExternalAPI(transaction);
            results.push({
                transaction_id: transaction.transaction_id,
                result: apiResult
            });
            
            if (apiResult.success) {
                successCount++;
            } else {
                failureCount++;
            }
            
            // Small delay between requests to be respectful to the external API
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`✅ Bulk processing complete: ${successCount} successful, ${failureCount} failed`);

        res.status(200).json({
            success: true,
            total_transactions: transactions.length,
            successful: successCount,
            failed: failureCount,
            results: results
        });
        
    } catch (error) {
        console.error('❌ Error in bulk transaction processing:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error while processing bulk transactions'
        });
    }
};

/**
 * Utility function to automatically send transaction to external API after creation
 * This should be called after INSERT INTO transaction statements
 * @param {number} transactionId - The newly created transaction ID
 */
const autoSendTransactionToAPI = async (transactionId) => {
    try {
        // Get the newly created transaction data (only approved withdrawals, deposits, and registration_fees)
        const query = `
            SELECT 
                t.trans_id as transaction_id,
                (t.created_at AT TIME ZONE 'Asia/Kolkata') as created_at,
                t.user_id as vendor_id,
                v.vendor_name,
                t.transaction_type,
                t.amount
            FROM transaction t 
            LEFT JOIN vendors v ON t.user_id = v.id 
            WHERE t.trans_id = $1
            AND t.status = 'approved' 
            AND t.transaction_type IN ('withdrawal', 'deposit', 'registration_fee')
        `;
        
        const result = await db.query(query, [transactionId]);
        
        if (result.rows.length === 0) {
            console.error('❌ Transaction not found for auto-send:', transactionId);
            return false;
        }

        const transactionData = result.rows[0];
        
        // Send to external API
        const apiResult = await sendTransactionToExternalAPI(transactionData);
        
        if (apiResult.success) {
            console.log(`✅ Auto-sent transaction ${transactionId} to external API successfully`);
        } else {
            console.error(`❌ Auto-send failed for transaction ${transactionId}:`, apiResult.error);
        }
        
        return apiResult.success;
        
    } catch (error) {
        console.error(`❌ Error in auto-send for transaction ${transactionId}:`, error);
        return false;
    }
};

/**
 * Push all transactions to external API (GET endpoint for frontend)
 * This function can be called from your website to sync all transactions
 */
const pushAllTransactionsToExternalAPI = async (req, res) => {
    try {
        console.log('🚀 Starting bulk transaction push to external API...');
        
        // Get all approved withdrawal, deposit, and registration_fee transactions from database
        const query = `
            SELECT 
                t.trans_id as transaction_id,
                (t.created_at AT TIME ZONE 'Asia/Kolkata') as created_at,
                t.user_id as vendor_id,
                v.vendor_name,
                t.transaction_type,
                t.amount
            FROM transaction t 
            LEFT JOIN vendors v ON t.user_id = v.id 
            WHERE t.status = 'approved' 
            AND t.transaction_type IN ('withdrawal', 'deposit', 'registration_fee')
            ORDER BY t.trans_id ASC
        `;
        
        const result = await db.query(query);
        const transactions = result.rows;
        
        if (transactions.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No transactions found to sync',
                total_transactions: 0,
                synced: 0,
                failed: 0
            });
        }

        console.log(`📤 Found ${transactions.length} transactions to sync with external API...`);
        
        const results = [];
        let successCount = 0;
        let failureCount = 0;
        let skippedCount = 0;

        // Process each transaction sequentially to avoid overwhelming the external API
        for (let i = 0; i < transactions.length; i++) {
            const transaction = transactions[i];
            
            try {
                console.log(`📤 Processing transaction ${i + 1}/${transactions.length}: ID ${transaction.transaction_id}`);
                
                const apiResult = await sendTransactionToExternalAPI(transaction);
                
                results.push({
                    transaction_id: transaction.transaction_id,
                    vendor_id: transaction.vendor_id,
                    amount: transaction.amount,
                    result: apiResult
                });
                
                if (apiResult.success) {
                    successCount++;
                    console.log(`✅ Transaction ${transaction.transaction_id} synced successfully`);
                } else {
                    failureCount++;
                    console.error(`❌ Transaction ${transaction.transaction_id} failed:`, apiResult.error);
                }
                
                // Add a small delay between requests to be respectful to the external API
                if (i < transactions.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
                }
                
            } catch (error) {
                failureCount++;
                console.error(`❌ Error processing transaction ${transaction.transaction_id}:`, error);
                results.push({
                    transaction_id: transaction.transaction_id,
                    vendor_id: transaction.vendor_id,
                    amount: transaction.amount,
                    result: {
                        success: false,
                        error: error.message
                    }
                });
            }
        }

        console.log(`🎉 Bulk sync complete: ${successCount} successful, ${failureCount} failed`);

        res.status(200).json({
            success: true,
            message: `Bulk sync completed successfully`,
            summary: {
                total_transactions: transactions.length,
                successful: successCount,
                failed: failureCount,
                success_rate: `${((successCount / transactions.length) * 100).toFixed(2)}%`
            },
            details: results,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error in bulk transaction sync:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error while syncing transactions',
            error: error.message
        });
    }
};

/**
 * Get transaction list from a specific date onwards
 * Returns: transaction_id, created_at (IST), vendor_id, vendor_name, transaction_type, amount
 * Sorted by transaction_id in ascending order
 * Includes: withdrawal, deposit, and registration_fee transactions (approved only)
 */
const getTransactionListFromDate = async (req, res) => {
    try {
        const { from_date, range = '1,10' } = req.query;
        
        if (!from_date) {
            return res.status(400).json({ 
                success: false,
                message: 'from_date parameter is required (format: YYYY-MM-DD)' 
            });
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(from_date)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid date format. Use YYYY-MM-DD format' 
            });
        }

        // Parse range parameter: "start,count" or just "start"
        const rangeParts = range.split(',');
        let start = parseInt(rangeParts[0], 10);
        let count = parseInt(rangeParts[1], 10);
        
        // Handle edge cases
        if (isNaN(start)) {
            return res.status(400).json({ message: 'Invalid range format. Use: start,count or just start' });
        }
        
        // Convert 0 to 1 (index starts from 1)
        if (start === 0) start = 1;
        
        // Validate start
        if (start < 1) {
            return res.status(400).json({ message: 'Start must be a positive number' });
        }
        
        // If count is not provided or invalid, get all rows from start to end
        if (isNaN(count) || count < 1) {
            count = null; // This will be handled in the query
        }
        
        // Calculate offset (convert to 0-based for SQL)
        const offset = start - 1;
        
        // Convert date to IST timezone for comparison
        const fromDateIST = `${from_date} 00:00:00+05:30`;
        
        // Get total count of approved withdrawal, deposit, and registration_fee transactions from the specified date
        const totalCountQuery = `SELECT COUNT(*) as total FROM transaction 
                                 WHERE status = 'approved' 
                                 AND transaction_type IN ('withdrawal', 'deposit', 'registration_fee')
                                 AND created_at::date >= $1::date`;
        const totalCountResult = await db.query(totalCountQuery, [from_date]);
        const totalRows = parseInt(totalCountResult.rows[0].total, 10);
        
        // Query to get transactions with vendor info and amount from the specified date
        let query, queryParams;
        
        if (count) {
            // If count is specified, use LIMIT and OFFSET
            query = `
                SELECT 
                    t.trans_id as transaction_id,
                    TO_CHAR(t.created_at, 'YYYY-MM-DD') as created_at,
                    t.user_id as vendor_id,
                    v.vendor_name,
                    t.transaction_type,
                    t.amount
                FROM transaction t 
                LEFT JOIN vendors v ON t.user_id = v.id 
                WHERE t.status = 'approved' 
                AND t.transaction_type IN ('withdrawal', 'deposit', 'registration_fee')
                AND (t.created_at AT TIME ZONE 'Asia/Kolkata')::date >= $1::date
                ORDER BY t.trans_id ASC
                LIMIT $2 OFFSET $3
            `;
            queryParams = [from_date, count, offset];
        } else {
            // If no count specified, get all rows from start to end
            query = `
                SELECT 
                    t.trans_id as transaction_id,
                    TO_CHAR(t.created_at, 'YYYY-MM-DD') as created_at,
                    t.user_id as vendor_id,
                    v.vendor_name,
                    t.transaction_type,
                    t.amount
                FROM transaction t 
                LEFT JOIN vendors v ON t.user_id = v.id 
                WHERE t.status = 'approved' 
                AND t.transaction_type IN ('withdrawal', 'deposit', 'registration_fee')
                AND t.created_at::date >= $1::date
                ORDER BY t.trans_id ASC
                OFFSET $2
            `;
            queryParams = [from_date, offset];
        }
        
        const result = await db.query(query, queryParams);

        // Data already includes transaction_id from the query
        const data = result.rows;

        // Convert timestamps to IST for frontend display
        const formattedData = data.map(row => formatTimestampsForDisplay(row, ['created_at']));

        res.status(200).json({
            success: true,
            data: formattedData,
            filter: {
                from_date: from_date
            },
            pagination: {
                start: start,
                count: count || 'all',
                returned: result.rows.length,
                total: totalRows
            }
        });
        
    } catch (error) {
        console.error('❌ Error fetching transaction list from date:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error while fetching transactions from date' 
        });
    }
};

/**
 * Push transactions from a specific ID onwards to external API
 * This allows you to specify from which transaction ID to start pushing
 */
const pushTransactionsFromId = async (req, res) => {
    try {
        const { from_transaction_id } = req.params;
        
        if (!from_transaction_id) {
            return res.status(400).json({
                success: false,
                message: 'from_transaction_id parameter is required'
            });
        }

        const startId = parseInt(from_transaction_id, 10);
        if (isNaN(startId) || startId < 1) {
            return res.status(400).json({
                success: false,
                message: 'from_transaction_id must be a valid positive number'
            });
        }

        console.log(`🚀 Starting transaction push from ID ${startId} onwards...`);
        
        // Get approved withdrawal, deposit, and registration_fee transactions from the specified ID onwards
        const query = `
            SELECT 
                t.trans_id as transaction_id,
                (t.created_at AT TIME ZONE 'Asia/Kolkata') as created_at,
                t.user_id as vendor_id,
                v.vendor_name,
                t.transaction_type,
                t.amount
            FROM transaction t 
            LEFT JOIN vendors v ON t.user_id = v.id 
            WHERE t.trans_id >= $1
            AND t.status = 'approved' 
            AND t.transaction_type IN ('withdrawal', 'deposit', 'registration_fee')
            ORDER BY t.trans_id ASC
        `;
        
        const result = await db.query(query, [startId]);
        const transactions = result.rows;
        
        if (transactions.length === 0) {
            return res.status(200).json({
                success: true,
                message: `No transactions found from ID ${startId} onwards`,
                from_transaction_id: startId,
                total_transactions: 0,
                synced: 0,
                failed: 0
            });
        }

        console.log(`📤 Found ${transactions.length} transactions from ID ${startId} onwards to push to external API...`);
        
        const results = [];
        let successCount = 0;
        let failureCount = 0;

        // Process each transaction sequentially to avoid overwhelming the external API
        for (let i = 0; i < transactions.length; i++) {
            const transaction = transactions[i];
            
            try {
                console.log(`📤 Processing transaction ${i + 1}/${transactions.length}: ID ${transaction.transaction_id}`);
                
                const apiResult = await sendTransactionToExternalAPI(transaction);
                
                results.push({
                    transaction_id: transaction.transaction_id,
                    vendor_id: transaction.vendor_id,
                    amount: transaction.amount,
                    result: apiResult
                });
                
                if (apiResult.success) {
                    successCount++;
                    console.log(`✅ Transaction ${transaction.transaction_id} pushed successfully`);
                } else {
                    failureCount++;
                    console.error(`❌ Transaction ${transaction.transaction_id} failed:`, apiResult.error);
                }
                
                // Add a small delay between requests to be respectful to the external API
                if (i < transactions.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
                }
                
            } catch (error) {
                failureCount++;
                console.error(`❌ Error processing transaction ${transaction.transaction_id}:`, error);
                results.push({
                    transaction_id: transaction.transaction_id,
                    vendor_id: transaction.vendor_id,
                    amount: transaction.amount,
                    result: {
                        success: false,
                        error: error.message
                    }
                });
            }
        }

        console.log(`🎉 Push complete from ID ${startId}: ${successCount} successful, ${failureCount} failed`);

        res.status(200).json({
            success: true,
            message: `Transaction push completed successfully from ID ${startId}`,
            summary: {
                from_transaction_id: startId,
                total_transactions: transactions.length,
                successful: successCount,
                failed: failureCount,
                success_rate: `${((successCount / transactions.length) * 100).toFixed(2)}%`
            },
            details: results,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error in transaction push from ID:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error while pushing transactions',
            error: error.message
        });
    }
};

module.exports = {
    getTransactionList,
    getTransactionSummary,
    getTransactionListFromDate,
    sendTransactionToExternalAPI,
    processTransactionAndSendToAPI,
    sendAllTransactionsToAPI,
    autoSendTransactionToAPI,
    pushAllTransactionsToExternalAPI,
    pushTransactionsFromId
};

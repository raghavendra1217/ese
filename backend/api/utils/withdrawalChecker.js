const db = require('../config/database');

/**
 * Check if user has pending withdrawal requests and cancel them if insufficient balance
 * @param {Object} client - Database client (transaction)
 * @param {string} userId - User ID
 * @param {number} newBalance - Balance after purchase
 * @returns {Object} - { cancelledWithdrawals: [], totalCancelledAmount: number }
 */
async function checkAndCancelWithdrawals(client, userId, newBalance) {
    try {
        // Get all pending withdrawal requests for this user
        const pendingWithdrawalsQuery = `
            SELECT trans_id, amount, description
            FROM transaction 
            WHERE user_id = $1 
            AND transaction_type = 'withdrawal' 
            AND status = 'pending'
            ORDER BY created_at ASC
        `;
        
        const { rows: pendingWithdrawals } = await client.query(pendingWithdrawalsQuery, [userId]);
        
        if (pendingWithdrawals.length === 0) {
            return { cancelledWithdrawals: [], totalCancelledAmount: 0 };
        }

        // Calculate total pending withdrawal amount
        const totalPendingAmount = pendingWithdrawals.reduce((sum, withdrawal) => {
            return sum + parseFloat(withdrawal.amount);
        }, 0);

        // If new balance is sufficient for all withdrawals, no need to cancel any
        if (newBalance >= totalPendingAmount) {
            return { cancelledWithdrawals: [], totalCancelledAmount: 0 };
        }

        // Find which withdrawals need to be cancelled
        const cancelledWithdrawals = [];
        let remainingBalance = newBalance;
        let totalCancelledAmount = 0;

        for (const withdrawal of pendingWithdrawals) {
            const withdrawalAmount = parseFloat(withdrawal.amount);
            
            // If this withdrawal would make balance negative, cancel it
            if (remainingBalance < withdrawalAmount) {
                // Cancel this withdrawal
                await client.query(
                    `UPDATE transaction 
                     SET status = 'cancelled', 
                         admin_comment = 'Auto-cancelled: Insufficient balance after product purchase'
                     WHERE trans_id = $1`,
                    [withdrawal.trans_id]
                );

                cancelledWithdrawals.push({
                    transactionId: withdrawal.trans_id,
                    amount: withdrawalAmount,
                    description: withdrawal.description
                });
                
                totalCancelledAmount += withdrawalAmount;
            } else {
                // This withdrawal can still proceed
                remainingBalance -= withdrawalAmount;
            }
        }

        console.log(`🔍 Withdrawal check for user ${userId}:`, {
            newBalance,
            totalPendingAmount,
            cancelledCount: cancelledWithdrawals.length,
            totalCancelledAmount
        });

        return { cancelledWithdrawals, totalCancelledAmount };

    } catch (error) {
        console.error('❌ Error checking withdrawals:', error);
        throw error;
    }
}

/**
 * Generate user-friendly message for cancelled withdrawals
 * @param {Array} cancelledWithdrawals - Array of cancelled withdrawal objects
 * @returns {string} - Formatted message
 */
function generateCancellationMessage(cancelledWithdrawals) {
    if (cancelledWithdrawals.length === 0) {
        return '';
    }

    const totalCancelled = cancelledWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    
    if (cancelledWithdrawals.length === 1) {
        return `Your pending withdrawal request of ₹${totalCancelled.toLocaleString('en-IN')} has been automatically cancelled due to insufficient balance after this purchase.`;
    } else {
        return `${cancelledWithdrawals.length} pending withdrawal requests totaling ₹${totalCancelled.toLocaleString('en-IN')} have been automatically cancelled due to insufficient balance after this purchase.`;
    }
}

module.exports = {
    checkAndCancelWithdrawals,
    generateCancellationMessage
};

// backend/api/controllers/vendorController.js

const db = require('../config/database');

// This function remains unchanged.
exports.getVendorDashboardStats = async (req, res) => {
    // ... (your existing getVendorDashboardStats code)
    const vendorId = req.user.user_id;

    if (!vendorId) {
        return res.status(401).json({ message: 'Not authorized, vendor ID missing.' });
    }

    try {
        const [
            resumeStatsResult,
            productStatsResult,
            tradingStatsResult,
            walletResult
        ] = await Promise.all([
            db.query(`
                SELECT 
                    COUNT(*) FILTER (WHERE task_status = 'assigned') as "assignedResumes",
                    COUNT(*) FILTER (WHERE task_status = 'completed') as "completedResumes"
                FROM resume WHERE vendor_id = $1
            `, [vendorId]),
            db.query(`
                SELECT COUNT(*) as "availableProductCount" 
                FROM product WHERE available_stock > 0
            `),
            db.query(`
                SELECT 
                    COUNT(*) FILTER (WHERE LOWER(is_approved) = 'approved') as "approvedPurchasesCount",
                    COALESCE(SUM(total_amount_paid) FILTER (WHERE LOWER(is_approved) = 'approved'), 0) as "approvedPurchasesValue",
                    COUNT(*) FILTER (WHERE is_approved = 'pending' AND payment_url IS NOT NULL) as "pendingPurchasesCount"
                FROM trading WHERE vendor_id = $1
            `, [vendorId]),
            db.query(
                'SELECT digital_money FROM wallet WHERE id = $1', 
                [vendorId]
            )
        ]);

        const resumeStats = resumeStatsResult.rows[0];
        const productStats = productStatsResult.rows[0];
        const tradingStats = tradingStatsResult.rows[0];
        const walletBalance = walletResult.rows.length > 0 ? walletResult.rows[0].digital_money : 0;

        const stats = {
            assignedResumes: parseInt(resumeStats.assignedResumes, 10),
            completedResumes: parseInt(resumeStats.completedResumes, 10),
            availableProducts: parseInt(productStats.availableProductCount, 10),
            digitalMoney: parseFloat(walletBalance),
            purchasedProducts: parseInt(tradingStats.approvedPurchasesCount, 10),
            purchasedValue: parseFloat(tradingStats.approvedPurchasesValue),
            pendingTradeApprovals: parseInt(tradingStats.pendingPurchasesCount, 10),
            pendingEmployeeApprovals: 0,
            availableVacancies: 10,
            employeesOnHold: 8,
            pendingPayOuts: parseInt(resumeStats.completedResumes, 10),
        };

        res.status(200).json(stats);

    } catch (error) {
        console.error(`❌ Error fetching dashboard stats for vendor ${vendorId}:`, error);
        res.status(500).json({ message: 'An internal server error occurred while fetching your dashboard statistics.' });
    }
};

// backend/api/controllers/vendorController.js

// exports.claimReferral = async (req, res) => {
//     const { referralId } = req.body; // The ID of the user being claimed
//     const vendorId = req.user.user_id; // The ID of the user who is claiming

//     if (!referralId) {
//         return res.status(400).json({ message: 'Referral ID is required.' });
//     }

//     const client = await db.connect();
//     try {
//         await client.query('BEGIN');

//         // First, verify the referralId is in the vendor's referral_id_list to prevent invalid claims
//         const vendorCheck = await client.query(
//             'SELECT referral_id_list FROM vendors WHERE id = $1', [vendorId]
//         );

//         if (vendorCheck.rowCount === 0 || !vendorCheck.rows[0].referral_id_list?.includes(referralId)) {
//             await client.query('ROLLBACK');
//             return res.status(403).json({ message: 'You are not authorized to claim this referral.' });
//         }
        
//         // Add the referralId to the claimed_referrals array.
//         // The `array_append` function is safe and adds the element if the array exists, or creates a new array if the column is null.
//         await client.query(
//             `UPDATE vendors SET claimed_referrals = array_append(claimed_referrals, $1) WHERE id = $2 AND NOT ($1 = ANY(claimed_referrals))`,
//             [referralId, vendorId]
//         );
        
//         // You might add logic here to add a bonus to the user's wallet.
//         // For example: await client.query('UPDATE wallet SET digital_money = digital_money + 100 WHERE id = $1', [vendorId]);

//         await client.query('COMMIT');
//         res.status(200).json({ message: `Successfully claimed referral ${referralId}.` });

//     } catch (error) {
//         await client.query('ROLLBACK');
//         console.error(`❌ Error claiming referral for vendor ${vendorId}:`, error);
//         res.status(500).json({ message: 'An internal server error occurred while claiming the referral.' });
//     } finally {
//         if (client) client.release();
//     }
// };

exports.claimReferral = async (req, res) => {
    const { referralId } = req.body; // The ID of the user being claimed
    const vendorId = req.user.user_id; // The ID of the user who is claiming
    const referralBonus = 299; // Define the bonus amount

    if (!referralId) {
        return res.status(400).json({ message: 'Referral ID is required.' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Step 1: Verify the referral is valid and ready to be claimed
        const vendorCheck = await client.query(
            'SELECT referral_id_list, claimed_referrals FROM vendors WHERE id = $1', [vendorId]
        );

        if (vendorCheck.rowCount === 0 || !vendorCheck.rows[0].referral_id_list?.includes(referralId)) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'You are not authorized to claim this referral.' });
        }
        
        // Prevent re-claiming
        if (vendorCheck.rows[0].claimed_referrals?.includes(referralId)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'This referral has already been claimed.' });
        }
        
        // --- NEW: Check if the referred user is approved in the login table ---
        const approvalCheck = await client.query(
            'SELECT is_approved FROM login WHERE user_id = $1', [referralId]
        );
        if (approvalCheck.rowCount === 0 || approvalCheck.rows[0].is_approved !== true) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'This referral is not yet approved and cannot be claimed.' });
        }

        // Step 2: Update the claimant's 'claimed_referrals' list
        await client.query(
            `UPDATE vendors SET claimed_referrals = array_append(claimed_referrals, $1) WHERE id = $2`,
            [referralId, vendorId]
        );
        
        // Step 3: Add the bonus to the claimant's wallet and get the new balance
        const updatedWallet = await client.query(
            `UPDATE wallet SET digital_money = digital_money + $1 WHERE id = $2 RETURNING digital_money`,
            [referralBonus, vendorId]
        );

        if (updatedWallet.rowCount === 0) {
            // This case should be rare if wallets are created on login/referral, but it's safe to handle
            throw new Error(`Wallet not found for claiming user ${vendorId}.`);
        }
        const balanceAfterTransaction = updatedWallet.rows[0].digital_money;

        // Step 4: Create a log for this transaction
        const description = `Referral bonus for user ${referralId}`;
        await client.query(
            `INSERT INTO transaction (user_id, transaction_type, amount, status, description, balance_after_transaction)
             VALUES ($1, 'referral_bonus', $2, 'approved', $3, $4)`,
            [vendorId, referralBonus, description, balanceAfterTransaction]
        );

        // If all steps succeed, commit the transaction
        await client.query('COMMIT');
        res.status(200).json({ message: `Successfully claimed referral and received a bonus of ₹${referralBonus}.` });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Error claiming referral for vendor ${vendorId}:`, error);
        res.status(500).json({ message: 'An internal server error occurred while claiming the referral.' });
    } finally {
        if (client) client.release();
    }
};


const getApplicablePercentage = (purchaseDate, percentages) => {
    if (!percentages || percentages.length === 0) {
        return 0; // Default to 0 if no percentages are set
    }
    // Filter to find all percentages valid up to the purchase date
    const validPercentages = percentages
        .filter(p => new Date(p.updated_date) <= purchaseDate)
        .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date)); // Sort descending by date

    // The most recent valid percentage is the first one in the sorted list
    return validPercentages.length > 0 ? parseFloat(validPercentages[0].percentage) : 0;
};

/**
 * Helper function to calculate the total claimable amount for a single referral.
 * @param {object} vendor - The vendor object containing total_spent, percentage, and total_claims.
 * @returns {number} The total calculated claimable amount.
 */
const calculateClaimableAmount = (vendor) => {
    const { total_spent, percentage, total_claims } = vendor;

    if (!total_spent || total_spent.length === 0) {
        return 0;
    }

    // Create a set of already claimed purchase dates for efficient lookup
    const claimedDates = new Set((total_claims || []).map(c => new Date(c.claimed_purchase_date).toISOString()));

    let totalClaimable = 0;

    for (const purchase of total_spent) {
        const purchaseDate = new Date(purchase.date_of_purchase);
        // If this purchase date has not been claimed yet...
        if (!claimedDates.has(purchaseDate.toISOString())) {
            const applicable_percentage = getApplicablePercentage(purchaseDate, percentage);
            const earnings = parseFloat(purchase.amount_spent) * (applicable_percentage / 100);
            totalClaimable += earnings;
        }
    }
    return totalClaimable;
};


/**
 * @desc    Get referred users list, sync their spending, and calculate claimable amounts.
 * @route   GET /api/vendor/referred-list
 * @access  Private
 */

exports.getReferredUsersList = async (req, res) => {
    const vendorId = req.user.user_id;
    const client = await db.connect();
    try {
        const vendorInfoResult = await client.query('SELECT referral_id_list FROM vendors WHERE id = $1', [vendorId]);
        const referralIds = vendorInfoResult.rows[0]?.referral_id_list;

        if (!referralIds || referralIds.length === 0) {
            client.release();
            return res.status(200).json({ allReferredUsers: [], claimedReferralIds: [] });
        }

        // --- Sync and Calculate Logic ---
        for (const refId of referralIds) {
            // 1. Get all approved purchases from the trading table for this referral
            const purchasesResult = await client.query(
                `SELECT date AS date_of_purchase, total_amount_paid AS amount_spent 
                 FROM trading 
                 WHERE vendor_id = $1 AND LOWER(is_approved) = 'approved' ORDER BY date ASC`,
                [refId]
            );

            // --- THE FIX IS HERE: Update the 'wallet' table, not 'vendors' ---
            // 2. Update the 'total_spent' JSONB column in the WALLET table
            await client.query(
                'UPDATE wallet SET total_spent = $1 WHERE id = $2',
                [JSON.stringify(purchasesResult.rows), refId]
            );
        }

        // --- THE FIX IS HERE: The main SELECT query is corrected ---
        // 3. Fetch all updated vendor data, joining with wallet for JSONB columns
        const referredUsersResult = await client.query(
            `SELECT 
                v.id, 
                v.vendor_name AS name, 
                l.is_approved, 
                w.total_spent, 
                w.percentage, 
                w.total_claims 
             FROM vendors v
             LEFT JOIN login l ON v.id = l.user_id
             LEFT JOIN wallet w ON v.id = w.id
             WHERE v.id = ANY($1)`,
            [referralIds]
        );

        // 4. Calculate 'claimable_now' for each user and add it to the object
        const finalResponseData = referredUsersResult.rows.map(vendor => ({
            ...vendor,
            claimable_now: calculateClaimableAmount(vendor)
        })).sort((a, b) => (b.claimable_now || 0) - (a.claimable_now || 0)); // Sort by claimable amount

        const claimantResult = await client.query('SELECT claimed_referrals FROM vendors WHERE id = $1', [vendorId]);

        res.status(200).json({
            allReferredUsers: finalResponseData,
            claimedReferralIds: claimantResult.rows[0]?.claimed_referrals || []
        });

    } catch (error) {
        console.error(`❌ Error in getReferredUsersList for vendor ${vendorId}:`, error);
        res.status(500).json({ message: 'Server error while fetching referral list.' });
    } finally {
        if (client) client.release();
    }
};


/**
 * @desc    Claim all available earnings for a specific referral.
 * @route   POST /api/vendor/claim-referral-earnings
 * @access  Private
 */
exports.claimReferralEarnings = async (req, res) => {
    const { referralId } = req.body;
    const vendorId = req.user.user_id;

    if (!referralId) return res.status(400).json({ message: 'Referral ID is required.' });

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // --- THE FIX IS HERE: Re-fetch and re-calculate from the 'wallet' table ---
        const walletDataRes = await client.query(
            `SELECT total_spent, percentage, total_claims FROM wallet WHERE id = $1 FOR UPDATE`, [referralId]
        );
        if (walletDataRes.rowCount === 0) throw new Error("Referred user's wallet not found.");

        const claimableAmount = calculateClaimableAmount(walletDataRes.rows[0]);
        
        if (claimableAmount <= 0) {
            return res.status(400).json({ message: 'No earnings available to claim for this referral.' });
        }

        const claimedDates = new Set((walletDataRes.rows[0].total_claims || []).map(c => new Date(c.claimed_purchase_date).toISOString()));
        const newClaims = [];
        (walletDataRes.rows[0].total_spent || []).forEach(purchase => {
            if (!claimedDates.has(new Date(purchase.date_of_purchase).toISOString())) {
                newClaims.push({
                    claimed_date: new Date().toISOString(),
                    claim_amount: parseFloat(purchase.amount_spent) * (getApplicablePercentage(new Date(purchase.date_of_purchase), walletDataRes.rows[0].percentage) / 100),
                    claimed_purchase_date: new Date(purchase.date_of_purchase).toISOString()
                });
            }
        });
        
        // --- THE FIX IS HERE: Add new claims to the 'wallet' table ---
        await client.query(
            `UPDATE wallet SET total_claims = COALESCE(total_claims, '[]'::jsonb) || $1::jsonb WHERE id = $2`,
            [JSON.stringify(newClaims), referralId]
        );

        // The rest of the logic is correct as it already targets the wallet and transaction tables.
        const updatedWallet = await client.query(
            `UPDATE wallet SET digital_money = digital_money + $1 WHERE id = $2 RETURNING digital_money`,
            [claimableAmount, vendorId]
        );
        const balanceAfter = updatedWallet.rows[0].digital_money;

        await client.query(
            `INSERT INTO transaction (user_id, transaction_type, amount, status, description, balance_after_transaction)
             VALUES ($1, 'referral_earning', $2, 'approved', $3, $4)`,
            [vendorId, claimableAmount, `Claimed earnings from referral ${referralId}`, balanceAfter]
        );
        
        await client.query('COMMIT');
        res.status(200).json({ message: `Successfully claimed ${claimableAmount.toFixed(2)} from referral.` });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Error in claimReferralEarnings for vendor ${vendorId}:`, error);
        res.status(500).json({ message: 'Server error while claiming earnings.' });
    } finally {
        if (client) client.release();
    }
};
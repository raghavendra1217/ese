// backend/api/controllers/vendorController.js
const { uploadFileToR2, deleteFileFromR2 } = require('../utils/cloudflareR2');

const db = require('../config/database');
const { formatTimestampsForDisplay } = require('../utils/timeUtils');

// Get referral tree for vendor
exports.getReferralTree = async (req, res) => {
    const vendorId = req.user.user_id;
    
    console.log(`🔍 [DEBUG] getReferralTree called for vendor ID: ${vendorId}`);
    
    if (!vendorId) {
        console.log(`❌ [DEBUG] No vendor ID found in request`);
        return res.status(401).json({ message: 'Not authorized, vendor ID missing.' });
    }

    try {
        console.log(`🔍 [DEBUG] Starting to fetch vendor information for ID: ${vendorId}`);
        
        // Get the vendor's own information
        const vendorQuery = `
            SELECT 
                v.id,
                COALESCE(v.vendor_name, 'Unknown') as name,
                COALESCE(l.email, 'no-email@example.com') as email,
                COALESCE(l.status, 'unknown') as status,
                COALESCE(w.digital_money, 0) as totalEarnings
            FROM vendors v
            JOIN login l ON v.id = l.user_id
            LEFT JOIN wallet w ON v.id = w.id
            WHERE v.id = $1
        `;
        
        const vendorResult = await db.query(vendorQuery, [vendorId]);
        console.log(`🔍 [DEBUG] Vendor query result:`, vendorResult.rows);
        
        if (vendorResult.rows.length === 0) {
            console.log(`❌ [DEBUG] Vendor not found in database`);
            return res.status(404).json({ message: 'Vendor not found.' });
        }
        
        const vendor = vendorResult.rows[0];
        console.log(`🔍 [DEBUG] Found vendor:`, vendor);
        
        // Get the list of referral IDs from referral_id_list - but only count approved vendors that exist
        const referralsResult = await db.query('SELECT referral_id_list FROM vendors WHERE id = $1', [vendorId]);
        const allReferralIds = referralsResult.rows[0]?.referral_id_list;
        
        console.log(`🔍 [DEBUG] All referral IDs found:`, allReferralIds);
        
        // ✅ NEW: Filter to only include approved vendors that exist
        let level1Referrals = [];
        let referralIds = [];
        
        if (allReferralIds && allReferralIds.length > 0) {
            const level1Query = `
                SELECT 
                    v.id,
                    COALESCE(v.vendor_name, 'Unknown') as name,
                    COALESCE(l.email, 'no-email@example.com') as email,
                    COALESCE(l.status, 'unknown') as status,
                    COALESCE(w.digital_money, 0) as totalEarnings
                FROM vendors v
                JOIN login l ON v.id = l.user_id
                LEFT JOIN wallet w ON v.id = w.id
                WHERE v.id = ANY($1)
                AND l.is_approved = TRUE -- ✅ NEW: Only count approved vendors
            `;
            
            const level1Result = await db.query(level1Query, [allReferralIds]);
            level1Referrals = level1Result.rows;
            referralIds = level1Referrals.map(ref => ref.id); // ✅ NEW: Use only the IDs of approved vendors
            console.log(`🔍 [DEBUG] Approved Level 1 referrals found:`, level1Referrals.length);
        } else {
            console.log(`🔍 [DEBUG] No referrals found in referral_id_list`);
        }
        
        // Build the referral tree recursively
        const buildReferralTree = async (referrals) => {
            const tree = [];
            
            for (const referral of referrals) {
                try {
                    // Get referral count for this person - only count approved vendors
                    let referralCount = 0;
                    try {
                        const referralCountQuery = `
                            SELECT referral_id_list FROM vendors WHERE id = $1
                        `;
                        const referralCountResult = await db.query(referralCountQuery, [referral.id]);
                        const theirReferralIds = referralCountResult.rows[0]?.referral_id_list;
                        
                        if (theirReferralIds && theirReferralIds.length > 0) {
                            // ✅ NEW: Only count approved vendors
                            const approvedReferralsQuery = `
                                SELECT COUNT(*) as count 
                                FROM vendors v
                                JOIN login l ON v.id = l.user_id
                                WHERE v.id = ANY($1)
                                AND l.is_approved = TRUE
                            `;
                            const approvedReferralsResult = await db.query(approvedReferralsQuery, [theirReferralIds]);
                            referralCount = parseInt(approvedReferralsResult.rows[0].count);
                        } else {
                            referralCount = 0;
                        }
                    } catch (countError) {
                        console.log(`⚠️ [DEBUG] Error counting referrals for ${referral.id}:`, countError.message);
                        referralCount = 0;
                    }
                    referral.referralCount = referralCount;
                    
                    // Get children (next level referrals) - only include approved vendors
                    let children = [];
                    try {
                        const childrenQuery = `
                            SELECT 
                                v.id,
                                COALESCE(v.vendor_name, 'Unknown') as name,
                                COALESCE(l.email, 'no-email@example.com') as email,
                                COALESCE(l.status, 'unknown') as status,
                                COALESCE(w.digital_money, 0) as totalEarnings
                            FROM vendors v
                            JOIN login l ON v.id = l.user_id
                            LEFT JOIN wallet w ON v.id = w.id
                            WHERE v.id = ANY(
                                SELECT unnest(referral_id_list) FROM vendors WHERE id = $1
                            )
                            AND l.is_approved = TRUE -- ✅ NEW: Only include approved vendors
                        `;
                        
                        const childrenResult = await db.query(childrenQuery, [referral.id]);
                        if (childrenResult.rows.length > 0) {
                            children = await buildReferralTree(childrenResult.rows);
                        }
                    } catch (childrenError) {
                        console.log(`⚠️ [DEBUG] Error fetching children for ${referral.id}:`, childrenError.message);
                        children = [];
                    }
                    
                    referral.children = children;
                    tree.push(referral);
                } catch (childError) {
                    console.error(`❌ [DEBUG] Error processing child referral ${referral.id}:`, childError);
                    referral.children = [];
                    referral.referralCount = 0;
                    tree.push(referral);
                }
            }
            
            return tree;
        };
        
        // Build the complete tree
        vendor.children = await buildReferralTree(level1Referrals);
        
        // Get total referral count for root vendor - only count approved vendors
        vendor.referralCount = referralIds ? referralIds.length : 0;
        
        console.log(`🔍 [DEBUG] Final referral tree structure:`, JSON.stringify(vendor, null, 2));
        res.status(200).json(vendor);
        
    } catch (error) {
        console.error(`❌ Error fetching referral tree for vendor ${vendorId}:`, error);
        console.error(`❌ [DEBUG] Full error stack:`, error.stack);
        res.status(500).json({ 
            message: 'An internal server error occurred while fetching your referral tree.',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// ✅ Import path if needed for constructing image URLs
exports.getVendorDashboardStats = async (req, res) => {

    const vendorId = req.user.user_id;

    console.log(vendorId)
    
    if (!vendorId) {
        return res.status(401).json({ message: 'Not authorized, vendor ID missing.' });
    }

    try {
        const [
            productStatsResult,
            tradingStatsResult,
            walletResult,
            // ✅ CHANGE: Added a new query to count sellable trades
            sellableTradesResult
        ] = await Promise.all([
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
            ),
            // ✅ CHANGE: This is the new query
            db.query(`
                SELECT COUNT(*) AS count 
                FROM trading 
                WHERE vendor_id = $1 AND is_approved = 'approved' AND (is_sold IS NULL OR is_sold = FALSE)
            `, [vendorId])
        ]);

        const productStats = productStatsResult.rows[0];
        const tradingStats = tradingStatsResult.rows[0];
        const walletBalance = walletResult.rows.length > 0 ? walletResult.rows[0].digital_money : 0;
        // ✅ CHANGE: Get the count from the new query result
        const sellableTradesCount = sellableTradesResult.rows[0].count;


        const stats = {
            availableProducts: parseInt(productStats.availableProductCount, 10),
            digitalMoney: parseFloat(walletBalance),
            purchasedProducts: parseInt(tradingStats.approvedPurchasesCount, 10),
            purchasedValue: parseFloat(tradingStats.approvedPurchasesValue),
            pendingTradeApprovals: parseInt(tradingStats.pendingPurchasesCount, 10),
            // ✅ CHANGE: Added the new stat to the response
            sellableTradesCount: parseInt(sellableTradesCount, 10),
            pendingEmployeeApprovals: 0,
            availableVacancies: 10,
            employeesOnHold: 8,
            pendingPayOuts: 0, // Removed resume dependency
        };

        res.status(200).json(stats);

    } catch (error) {
        console.error(`❌ Error fetching dashboard stats for vendor ${vendorId}:`, error);
        res.status(500).json({ message: 'An internal server error occurred while fetching your dashboard statistics.' });
    }
};


exports.getVendorProfile = async (req, res) => {
  try {
    const query = `
      SELECT 
        vendor_name,
        email,
        phone_number,
        aadhar_number,
        pan_card_number,
        bank_name,
        account_number,
        ifsc_code,
        passport_photo_url,
        address
      FROM vendors WHERE id = $1
    `;

    const result = await db.query(query, [req.user.user_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const row = result.rows[0];
    res.json({
      vendorName: row.vendor_name,
      email: row.email,
      phoneNumber: row.phone_number,
      aadharNumber: row.aadhar_number,
      panCardNumber: row.pan_card_number,
      bankName: row.bank_name,
      accountNumber: row.account_number,
      ifscCode: row.ifsc_code,
      passportPhotoUrl: row.passport_photo_url,
      address: row.address,
    });
  } catch (err) {
    console.error('❌ Error in getVendorProfile:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// exports.updateVendorProfile = async (req, res) => {
//   try {
//     const { bankName, accountNumber, ifscCode } = req.body;

//     const query = `
//       UPDATE vendors
//       SET bank_name = $1,
//           account_number = $2,
//           ifsc_code = $3
//       WHERE id = $4
//       RETURNING *
//     `;

//     const values = [bankName, accountNumber, ifscCode, req.user.user_id];
//     const result = await db.query(query, values);

//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: 'Vendor not found' });
//     }

//     res.json({ message: 'Profile updated successfully', updatedVendor: result.rows[0] });
//   } catch (err) {
//     console.error('❌ Error in updateVendorProfile:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

exports.uploadVendorProfileImage = async (req, res) => {
  const path = require('path');
  const vendorId = req.user.user_id;
  const client = await db.connect();

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided.' });
    }
    await client.query('BEGIN');

    // Step 1: Get the user's current photo URL to decide our strategy.
    const userRes = await client.query('SELECT passport_photo_url FROM vendors WHERE id = $1 FOR UPDATE', [vendorId]);
    if (userRes.rows.length === 0) {
      throw new Error('Vendor not found.');
    }
    const currentPhotoUrl = userRes.rows[0].passport_photo_url;
    
    let newFilename;
    const fileExtension = path.extname(req.file.originalname);

    // Step 2: Decide whether to REPLACE an existing file or CREATE a new sequential one.
    const isStandardFormat = currentPhotoUrl && currentPhotoUrl.includes('passport_photos/PP_');

    if (isStandardFormat) {
        // --- REPLACE LOGIC ---
        console.log(`[INFO] Replacing existing photo for vendor ${vendorId}`);
        newFilename = path.basename(currentPhotoUrl); // e.g., "PP_081.png"
        
        // Before uploading the new file, delete the old one from R2.
        const r2Key = `passport_photos/${newFilename}`;
        await deleteFileFromR2('passport_photos', newFilename);
        console.log(`[INFO] Deleted old file from R2: ${r2Key}`);
        
    } else {
        // --- CREATE NEW LOGIC ---
        console.log(`[INFO] Creating new sequential photo ID for vendor ${vendorId}`);
        // Find the highest number in all 'PP_XXX' filenames.
        const lastIdRes = await client.query(`
            SELECT passport_photo_url FROM vendors 
            WHERE passport_photo_url LIKE '%passport_photos/PP_%'
            ORDER BY CAST(SUBSTRING(passport_photo_url FROM 'PP_(\\d+)') AS INTEGER) DESC 
            LIMIT 1;
        `);
        
        let nextNum = 1;
        if (lastIdRes.rows.length > 0) {
            const lastUrl = lastIdRes.rows[0].passport_photo_url;
            const lastNumMatch = lastUrl.match(/PP_(\d+)/);
            if (lastNumMatch) {
                nextNum = parseInt(lastNumMatch[1], 10) + 1;
            }
        }
        
        const formattedNextNum = String(nextNum).padStart(3, '0');
        newFilename = `PP_${formattedNextNum}${fileExtension}`;
    }

    // Step 3: Upload the new file to R2 with the determined filename.
    const imageUrl = await uploadFileToR2(req.file, 'passport_photos', newFilename);
    console.log(`[INFO] Uploaded new file to R2: ${imageUrl}`);
    
    // Step 4: Update the database with the final, correct URL.
    await client.query(
      'UPDATE vendors SET passport_photo_url = $1 WHERE id = $2',
      [imageUrl, vendorId]
    );

    await client.query('COMMIT');
    
    res.json({ imageUrl });

  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('❌ Rollback failed:', rollbackErr);
    }
    console.error(`❌ Error uploading vendor profile image for ${vendorId}:`, err);
    res.status(500).json({ message: 'Image upload failed', error: err.message });
  } finally {
    client.release();
  }
};

// Add this new function to vendorController.js

/**
 * @desc    Get just the vendor's passport photo URL.
 * @route   GET /api/vendor/profile/photo-url
 * @access  Private (Vendor)
 */
exports.getVendorPhotoUrl = async (req, res) => {
  try {
    const query = 'SELECT passport_photo_url FROM vendors WHERE id = $1';
    const result = await db.query(query, [req.user.user_id]);

    if (result.rows.length === 0) {
      // It's not an error if the vendor doesn't exist, just return null.
      return res.status(200).json({ passportPhotoUrl: null });
    }
    
    // Return the URL, which might be null if they haven't uploaded one.
    res.json({ passportPhotoUrl: result.rows[0].passport_photo_url });

  } catch (err) {
    console.error('❌ Error in getVendorPhotoUrl:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.claimReferral = async (req, res) => {
    const { referralId } = req.body; // The ID of the user being claimed
    const vendorId = req.user.user_id; // The ID of the user who is claiming
    const referralBonus = 1999;

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

/**
 * @desc    Get pending withdrawal requests for vendor's referred users
 * @route   GET /api/vendor/withdrawal-requests
 * @access  Private (Vendor)
 */
exports.getPendingWithdrawals = async (req, res) => {
    const vendorId = req.user.user_id;
    
    try {
        // Get vendor's referral list
        const vendorResult = await db.query('SELECT referral_id_list FROM vendors WHERE id = $1', [vendorId]);
        const referralIds = vendorResult.rows[0]?.referral_id_list;

        if (!referralIds || referralIds.length === 0) {
            return res.status(200).json({ withdrawalRequests: [] });
        }

        // Get pending withdrawal requests from referred users
        const query = `
            SELECT 
                t.trans_id,
                t.user_id,
                t.amount,
                t.status,
                t.description,
                t.created_at,
                v.vendor_name as user_name,
                v.email,
                v.phone_number,
                w.digital_money as current_balance
            FROM transaction t
            JOIN vendors v ON t.user_id = v.id
            LEFT JOIN wallet w ON t.user_id = w.id
            WHERE t.transaction_type = 'withdrawal' 
            AND t.status = 'pending'
            AND t.user_id = ANY($1)
            ORDER BY t.created_at DESC
        `;

        const { rows } = await db.query(query, [referralIds]);
        
        res.status(200).json({ withdrawalRequests: rows });

    } catch (error) {
        console.error('❌ Error fetching pending withdrawals for vendor:', error);
        res.status(500).json({ message: 'Server error while fetching withdrawal requests.' });
    }
};

/**
 * @desc    Reject a withdrawal request by vendor
 * @route   POST /api/vendor/reject-withdrawal
 * @access  Private (Vendor)
 */
exports.rejectWithdrawal = async (req, res) => {
    const vendorId = req.user.user_id;
    const { transactionId, rejectionReason } = req.body;

    if (!transactionId || !rejectionReason) {
        return res.status(400).json({ message: 'Transaction ID and rejection reason are required.' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Verify the transaction exists and is pending
        const transactionQuery = `
            SELECT t.*, v.referral_id_list
            FROM transaction t
            JOIN vendors v ON v.id = $2
            WHERE t.trans_id = $1 AND t.transaction_type = 'withdrawal' AND t.status = 'pending'
        `;
        const transactionResult = await client.query(transactionQuery, [transactionId, vendorId]);

        if (transactionResult.rows.length === 0) {
            throw new Error('Transaction not found or already processed.');
        }

        const transaction = transactionResult.rows[0];
        const referralIds = transaction.referral_id_list;

        // Verify the user making the withdrawal is in vendor's referral list
        if (!referralIds || !referralIds.includes(transaction.user_id)) {
            throw new Error('You do not have permission to reject this withdrawal request.');
        }

        // Update transaction status to rejected with vendor comment
        await client.query(
            `UPDATE transaction
             SET status = 'rejected',
                 admin_comment = $1
             WHERE trans_id = $2`,
            [`Rejected by vendor: ${rejectionReason}`, transactionId]
        );

        await client.query('COMMIT');

        res.status(200).json({
            message: 'Withdrawal request has been rejected successfully.',
            transactionId: transactionId
        });

    } catch (error) {
        await client.query('ROLLBACK');

        let errorMessage = 'Server error while rejecting withdrawal.';
        if (error.message.includes('Transaction not found')) {
            errorMessage = 'Transaction not found or already processed.';
        } else if (error.message.includes('permission')) {
            errorMessage = 'You do not have permission to reject this withdrawal request.';
        }

        res.status(500).json({ message: errorMessage });

    } finally {
        client.release();
    }
};

exports.getReferredUsersList = async (req, res) => {
    const vendorId = req.user.user_id; // The ID of the logged-in vendor (the referrer)
    const client = await db.connect();
    try {
        const vendorInfoResult = await client.query('SELECT referral_id_list FROM vendors WHERE id = $1', [vendorId]);
        const referralIds = vendorInfoResult.rows[0]?.referral_id_list;

        if (!referralIds || referralIds.length === 0) {
            // This early return is correct.
            return res.status(200).json({ allReferredUsers: [], claimedReferralIds: [] });
        }

        // --- NEW, SIMPLIFIED LOGIC ---
        // We will no longer "sync" data. Instead, we calculate stats directly from the trading table.
        // This query is much more efficient and reflects the new data model.
        
        const query = `
            WITH ReferralStats AS (
                -- First, calculate stats for each referred user
                SELECT
                    vendor_id, -- The ID of the person who made the purchase
                    COUNT(*) FILTER (WHERE is_approved = 'approved') AS total_purchases,
                    COALESCE(SUM(total_amount_paid) FILTER (WHERE is_approved = 'approved'), 0) AS total_spent,
                    -- CRITICAL: Calculate UNCLAIMED commission for the LOGGED IN VENDOR ($1)
                    COALESCE(SUM(total_amount_paid * (percentage / 100)) FILTER (
                        WHERE is_approved = 'approved' 
                        AND is_claimed = FALSE 
                        AND referred_id = $1 -- Only for commissions owed to the current user
                    ), 0) AS unclaimed_commission
                FROM trading
                WHERE vendor_id = ANY($2) -- Only for users in the referral list
                GROUP BY vendor_id
            )
            -- Now, join these stats with the vendor information
            SELECT 
                v.id, 
                v.vendor_name AS name, 
                l.is_approved,
                w.percentage, -- Get the referred user's current percentage setting
                COALESCE(rs.total_purchases, 0)::int AS total_purchases,
                COALESCE(rs.total_spent, 0)::float AS total_spent_by_referrals,
                COALESCE(rs.unclaimed_commission, 0)::float AS claimable_now
            FROM vendors v
            JOIN login l ON v.id = l.user_id
            LEFT JOIN wallet w ON v.id = w.id
            LEFT JOIN ReferralStats rs ON v.id = rs.vendor_id
            WHERE v.id = ANY($2)
            ORDER BY claimable_now DESC, v.vendor_name ASC;
        `;
        
        // This query needs the logged-in vendor's ID ($1) and the list of their referrals ($2)
        const referredUsersResult = await client.query(query, [vendorId, referralIds]);

        // The data is already calculated, so we just use it directly.
        const finalResponseData = referredUsersResult.rows;

        // This part is still needed to know which signup bonuses have been claimed
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


// Add these two new functions to: backend/api/controllers/vendorController.js

/**
 * @desc    Get a list of all individual, unclaimed commissionable trades for the logged-in vendor.
 * @route   GET /api/vendor/unclaimed-commissions
 * @access  Private
 */
exports.getUnclaimedCommissions = async (req, res) => {
    const vendorId = req.user.user_id; // The ID of the logged-in referrer

    try {
        const query = `
            SELECT 
                t.trade_id,
                t.date,
                t.total_amount_paid,
                t.percentage,
                v.vendor_name AS purchaser_name
            FROM trading t
            JOIN vendors v ON t.vendor_id = v.id
            WHERE 
                t.referred_id = $1
                AND t.is_approved = 'approved'
                AND t.is_claimed = FALSE
                AND t.percentage IS NOT NULL 
                AND t.percentage > 0
            ORDER BY t.date ASC;
        `;
        const { rows } = await db.query(query, [vendorId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error(`❌ Error fetching unclaimed commissions for vendor ${vendorId}:`, error);
        res.status(500).json({ message: 'Server error while fetching commissions.' });
    }
};

/**
 * @desc    Get claimed commissions history for a vendor
 * @route   GET /api/vendor/claimed-commissions
 * @access  Private
 */
exports.getClaimedCommissions = async (req, res) => {
    const vendorId = req.user.user_id; // The ID of the logged-in referrer

    try {
        const query = `
            SELECT 
                t.trade_id,
                t.date,
                t.total_amount_paid,
                t.percentage,
                v.vendor_name AS purchaser_name,
                COALESCE(t.claimed_date, t.date) AS claimed_date
            FROM trading t
            JOIN vendors v ON t.vendor_id = v.id
            WHERE 
                t.referred_id = $1
                AND t.is_approved = 'approved'
                AND t.is_claimed = TRUE
                AND t.percentage IS NOT NULL 
                AND t.percentage > 0
            ORDER BY t.date DESC;
        `;
        const { rows } = await db.query(query, [vendorId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error(`❌ Error fetching claimed commissions for vendor ${vendorId}:`, error);
        res.status(500).json({ message: 'Server error while fetching claimed commissions.' });
    }
};

// ✅ GET /api/vendor/profile
// vendorController.js

// backend/api/controllers/vendorController.js




exports.claimAllCommissions = async (req, res) => {
    const vendorId = req.user.user_id; // The ID of the logged-in referrer
    const client = await db.connect();
    
    try {
        await client.query('BEGIN');

        // Step 1: SERVER-SIDE CALCULATION for security. (This part is unchanged)
        const earningsRes = await client.query(
            `SELECT 
                COALESCE(SUM(total_amount_paid * (percentage / 100)), 0) AS total_earnings,
                ARRAY_AGG(trade_id) AS trade_ids_to_claim
             FROM trading
             WHERE 
                referred_id = $1
                AND is_approved = 'approved'
                AND is_claimed = FALSE
                AND percentage IS NOT NULL
                AND percentage > 0 
                AND percentage <= 5`, // Security cap
            [vendorId]
        );

        const totalEarnings = parseFloat(earningsRes.rows[0].total_earnings);
        const tradeIdsToClaim = earningsRes.rows[0].trade_ids_to_claim || [];

        // --- NEW DETAILED LOGGING LOGIC ---
        if (totalEarnings <= 0 || tradeIdsToClaim.length === 0) {
            // If the efficient check fails, run a detailed diagnostic query for logging.
            console.log(`[INFO] No valid commissions found for vendor ${vendorId}. Running diagnostics...`);
            
            const diagnosticQuery = `
                SELECT 
                    trade_id,
                    vendor_id AS purchaser,
                    is_approved,
                    is_claimed,
                    percentage,
                    total_amount_paid
                FROM trading
                WHERE referred_id = $1
                ORDER BY date DESC;
            `;
            const diagnosticResult = await client.query(diagnosticQuery, [vendorId]);
            
            if (diagnosticResult.rows.length === 0) {
                console.log(`[DEBUG] Reason: No trades exist in the database where referred_id = ${vendorId}.`);
            } else {
                console.log(`[DEBUG] Breakdown of all trades for referrer ${vendorId}:`);
                // console.table() provides a clean, readable table in your terminal.
                console.table(diagnosticResult.rows);
                console.log(`[DEBUG] Check the table above. A trade is only valid if: is_approved = 'approved', is_claimed = false, and percentage is a number between 0.01 and 5.`);
            }
            
            // This is the original logic: rollback and return the error to the user.
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'No valid commissions available to claim.' });
        }
        // --- END OF NEW LOGIC ---

        // Step 2: Mark ONLY the calculated trades as claimed.
        await client.query(
            `UPDATE trading SET is_claimed = TRUE, claimed_date = NOW() WHERE trade_id = ANY($1)`,
            [tradeIdsToClaim]
        );
        
        // Step 3: Add the earnings to the referrer's wallet.
        const updatedWallet = await client.query(
            'UPDATE wallet SET digital_money = digital_money + $1 WHERE id = $2 RETURNING digital_money',
            [totalEarnings, vendorId]
        );
        const balanceAfter = updatedWallet.rows[0].digital_money;

        // Step 4: Create a transaction log.
        const description = `Claimed referral commissions from ${tradeIdsToClaim.length} trades.`;
        await client.query(
            `INSERT INTO transaction (user_id, transaction_type, amount, status, description, balance_after_transaction)
             VALUES ($1, 'commission_claim', $2, 'approved', $3, $4)`,
            [vendorId, totalEarnings, description, balanceAfter]
        );

        await client.query('COMMIT');
        
        res.status(200).json({ 
            message: `Successfully claimed ₹${totalEarnings.toFixed(2)} from ${tradeIdsToClaim.length} trades.` 
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Error claiming commissions for vendor ${vendorId}:`, error);
        res.status(500).json({ message: 'Server error while claiming commissions.' });
    } finally {
        if (client) client.release();
    }
};


//
// 🚀 --- NEW DASHBOARD WIDGETS CONTROLLERS --- 🚀
//

/**
 * @desc    Get all Key Performance Indicators (KPIs) for the vendor dashboard.
 * @route   GET /api/vendor/dashboard/kpis
 * @access  Private (Vendor)
 */
exports.getDashboardKpis = async (req, res) => {
    const vendorId = req.user.user_id;
    try {
        const query = `
            WITH WalletInfo AS (
                -- Get current wallet balance
                SELECT COALESCE(digital_money, 0) AS balance FROM wallet WHERE id = $1
            ),
            ActiveInvestments AS (
                -- Calculate the total current value of all active, approved investments (including wild products)
                SELECT COALESCE(SUM(
                    t.no_of_stock_bought * 
                    CASE 
                        WHEN t.product_id LIKE 'WP_%' THEN wp.selling_price
                        ELSE p.selling_price
                    END
                ), 0) AS value
                FROM trading t
                LEFT JOIN product p ON t.product_id = p.product_id AND t.product_id NOT LIKE 'WP_%'
                LEFT JOIN wild_products wp ON t.product_id = wp.wild_product_id AND t.product_id LIKE 'WP_%'
                WHERE t.vendor_id = $1 AND t.is_approved = 'approved' AND (t.is_sold IS NULL OR t.is_sold = FALSE)
            ),
            UnclaimedCommissions AS (
                -- Calculate total unclaimed commissions owed to this vendor
                SELECT COALESCE(SUM(total_amount_paid * (percentage / 100)), 0) AS total
                FROM trading
                WHERE referred_id = $1 AND is_approved = 'approved' AND is_claimed = FALSE AND percentage IS NOT NULL AND percentage > 0
            ),
            LifetimeEarnings AS (
                -- Sum of all positive, approved transactions (sales, commissions, bonuses)
                SELECT COALESCE(SUM(amount), 0) AS total
                FROM transaction
                WHERE user_id = $1 AND status = 'approved' AND amount > 0
                  AND transaction_type IN ('sale', 'referral_bonus', 'commission_claim', 'referral_earning')
            )
            SELECT
                (SELECT balance FROM WalletInfo) AS "walletBalance",
                (SELECT value FROM ActiveInvestments) AS "activeInvestmentValue",
                (SELECT total FROM UnclaimedCommissions) AS "unclaimedCommissions",
                (SELECT total FROM LifetimeEarnings) AS "lifetimeEarnings"
        `;

        const { rows } = await db.query(query, [vendorId]);
        const kpis = {
            walletBalance: parseFloat(rows[0].walletBalance || 0),
            activeInvestmentValue: parseFloat(rows[0].activeInvestmentValue || 0),
            unclaimedCommissions: parseFloat(rows[0].unclaimedCommissions || 0),
            lifetimeEarnings: parseFloat(rows[0].lifetimeEarnings || 0),
        };
        res.status(200).json(kpis);

    } catch (error) {
        console.error(`❌ Error fetching dashboard KPIs for vendor ${vendorId}:`, error);
        res.status(500).json({ message: 'Server error while fetching KPIs.' });
    }
};


// exports.getEarningsOverTime = async (req, res) => {
//     const vendorId = req.user.user_id;
//     try {
//         // ✅ CHANGE: The query now calculates a CUMULATIVE (running) total.
//         const query = `
//             -- Use a Common Table Expression (CTE) to first get the sum for each week
//             WITH WeeklyEarnings AS (
//                 SELECT 
//                     DATE_TRUNC('week', created_at) AS week_start,
//                     SUM(amount) as weekly_total
//                 FROM transaction
//                 WHERE 
//                     user_id = $1
//                     AND status = 'approved'
//                     AND amount > 0
//                     AND transaction_type IN ('sale', 'referral_bonus', 'commission_claim', 'referral_earning')
//                     AND created_at >= NOW() - INTERVAL '10 weeks'
//                 GROUP BY week_start
//             )
//             -- Now, select from the weekly sums and create a running total
//             SELECT
//                 week_start,
//                 -- This is the window function that creates the cumulative sum
//                 SUM(weekly_total) OVER (ORDER BY week_start ASC) as "cumulativeEarnings"
//             FROM WeeklyEarnings
//             ORDER BY week_start ASC;
//         `;
//         const { rows } = await db.query(query, [vendorId]);
        
//         // ✅ CHANGE: Map the new 'cumulativeEarnings' column to the 'earnings' property
//         const formattedData = rows.map(row => ({
//             name: new Date(row.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
//             earnings: parseFloat(row.cumulativeEarnings)
//         }));

//         res.status(200).json(formattedData);
//     } catch (error) {
//         console.error(`❌ Error fetching earnings over time for vendor ${vendorId}:`, error);
//         res.status(500).json({ message: 'Server error while fetching earnings chart data.' });
//     }
// };

/**
 * @desc    Get data for CUMULATIVE earnings over time chart (DAILY).
 * @route   GET /api/vendor/dashboard/earnings-over-time
 * @access  Private (Vendor)
 */
exports.getEarningsOverTime = async (req, res) => {
    const vendorId = req.user.user_id;
    try {
        // ✅ CHANGE: The query now groups by DAY and has NO time limit.
        const query = `
            WITH DailyEarnings AS (
                SELECT 
                    -- Truncate to the day
                    DATE_TRUNC('day', created_at) AS day_start,
                    SUM(amount) as daily_total
                FROM transaction
                WHERE 
                    user_id = $1
                    AND status = 'approved'
                    AND amount > 0
                    AND transaction_type IN ('sale', 'referral_bonus', 'commission_claim', 'referral_earning')
                -- No time limit, so it includes all historical data
                GROUP BY day_start
            )
            SELECT
                day_start,
                -- The window function creates the cumulative sum day-by-day
                SUM(daily_total) OVER (ORDER BY day_start ASC) as "cumulativeEarnings"
            FROM DailyEarnings
            ORDER BY day_start ASC;
        `;
        const { rows } = await db.query(query, [vendorId]);
        
        const formattedData = rows.map(row => ({
            name: new Date(row.day_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            earnings: parseFloat(row.cumulativeEarnings)
        }));

        res.status(200).json(formattedData);
    } catch (error) {
        console.error(`❌ Error fetching earnings over time for vendor ${vendorId}:`, error);
        res.status(500).json({ message: 'Server error while fetching earnings chart data.' });
    }
};
/**
 * @desc    Get data for earnings sources pie chart.
 * @route   GET /api/vendor/dashboard/earnings-sources
 * @access  Private (Vendor)
 */
exports.getEarningsSources = async (req, res) => {
    const vendorId = req.user.user_id;
    try {
        const query = `
            SELECT 
                -- Categorize earnings by their source
                CASE 
                    WHEN transaction_type = 'sale' THEN 'Profit from Sales'
                    WHEN transaction_type IN ('commission_claim', 'referral_earning') THEN 'Referral Commissions'
                    WHEN transaction_type = 'referral_bonus' THEN 'Sign-up Bonuses'
                    ELSE 'Other'
                END as source,
                SUM(amount) as "totalAmount"
            FROM transaction
            WHERE 
                user_id = $1
                AND status = 'approved'
                AND amount > 0
                AND transaction_type IN ('sale', 'referral_bonus', 'commission_claim', 'referral_earning')
            GROUP BY source;
        `;
        const { rows } = await db.query(query, [vendorId]);

        // Format for chart library
        const formattedData = rows.map(row => ({
            name: row.source,
            value: parseFloat(row.totalAmount)
        }));

        res.status(200).json(formattedData);
    } catch (error) {
        console.error(`❌ Error fetching earnings sources for vendor ${vendorId}:`, error);
        res.status(500).json({ message: 'Server error while fetching earnings sources data.' });
    }
};

/**
 * @desc    Get the last 5 transactions for the recent activity feed.
 * @route   GET /api/vendor/dashboard/recent-activity
 * @access  Private (Vendor)
 */
exports.getRecentActivity = async (req, res) => {
    const vendorId = req.user.user_id;
    try {
        const query = `
            SELECT
                trans_id,
                transaction_type,
                amount,
                created_at,
                status
            FROM transaction
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 5;
        `;
        const { rows } = await db.query(query, [vendorId]);

        // Convert timestamps to IST for frontend display
        const formattedTransactions = rows.map(row => formatTimestampsForDisplay(row, ['created_at']));

        res.status(200).json(formattedTransactions);
    } catch (error) {
        console.error(`❌ Error fetching recent activity for vendor ${vendorId}:`, error);
        res.status(500).json({ message: 'Server error while fetching recent activity.' });
    }
};


/**
 * @desc    Get the top 5 performing referrals by commission generated.
 * @route   GET /api/vendor/dashboard/referral-leaderboard
 * @access  Private (Vendor)
 */
exports.getReferralLeaderboard = async (req, res) => {
    const vendorId = req.user.user_id;
    try {
        const query = `
            SELECT 
                v.vendor_name as name,
                COALESCE(SUM(t.total_amount_paid * (t.percentage / 100)), 0) AS "totalCommission"
            FROM trading t
            JOIN vendors v ON t.vendor_id = v.id -- Join to get the name of the person who made the purchase
            WHERE 
                t.referred_id = $1 -- Filter for trades referred by the logged-in vendor
                AND t.is_approved = 'approved'
                AND t.percentage IS NOT NULL AND t.percentage > 0
            GROUP BY v.vendor_name
            ORDER BY "totalCommission" DESC
            LIMIT 5;
        `;
        const { rows } = await db.query(query, [vendorId]);
        
        const leaderboard = rows.map(row => ({
            name: row.name,
            value: parseFloat(row.totalCommission)
        }));
        
        res.status(200).json(leaderboard);
    } catch (error) {
        console.error(`❌ Error fetching referral leaderboard for vendor ${vendorId}:`, error);
        res.status(500).json({ message: 'Server error while fetching referral leaderboard.' });
    }
};

exports.getDashboardReferralStats = async (req, res) => {
    const vendorId = req.user.user_id;
    const client = await db.connect();
    try {
        // First, get the list of IDs this vendor has referred (this part is unchanged)
        const referralsResult = await client.query('SELECT referral_id_list FROM vendors WHERE id = $1', [vendorId]);
        const referralIds = referralsResult.rows[0]?.referral_id_list;

        // If they have no referrals, return an empty array
        if (!referralIds || referralIds.length === 0) {
            return res.status(200).json([]);
        }

        // ✅ UPDATED QUERY: This query now filters for approved referrals only
        const statsQuery = `
            SELECT
                v.vendor_name AS name,
                COALESCE(SUM(t.total_amount_paid), 0) AS "totalSpent",
                COUNT(t.trade_id) AS "purchaseCount"
            FROM vendors v
            -- Join the login table to check the approval status
            JOIN login l ON v.id = l.user_id 
            -- Left Join trading to include approved referrals who haven't purchased yet
            LEFT JOIN trading t ON v.id = t.vendor_id AND t.is_approved = 'approved'
            WHERE 
                v.id = ANY($1)      -- Must be in the user's referral list
                AND l.is_approved = TRUE -- AND the referral must be approved in the login table
            GROUP BY v.id, v.vendor_name
            ORDER BY "totalSpent" DESC;
        `;
        
        const { rows } = await client.query(statsQuery, [referralIds]);

        // Format the numbers before sending (this part is unchanged)
        const formattedData = rows.map(row => ({
            name: row.name,
            totalSpent: parseFloat(row.totalSpent),
            purchaseCount: parseInt(row.purchaseCount, 10)
        }));

        res.status(200).json(formattedData);

    } catch (error) {
        console.error(`❌ Error fetching dashboard referral stats for vendor ${vendorId}:`, error);
        res.status(500).json({ message: 'Server error while fetching referral stats.' });
    } finally {
        if (client) client.release();
    }
};
// backend/api/controllers/tradingController.js

const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { checkAndCancelWithdrawals, generateCancellationMessage } = require('../utils/withdrawalChecker');
const { uploadFileToR2 } = require('../utils/cloudflareR2');
const { isInPersonalQuotaPhase } = require('../utils/timeUtils');
const path = require('path');

/**
 * Helper function to calculate stock status based on available stock
 * @param {number} availableStock - The available stock quantity
 * @returns {string} - The calculated stock status
 */
const calculateStockStatus = (availableStock) => {
    const stock = parseInt(availableStock, 10);
    
    if (stock === 0) {
        return 'out_of_stock';
    } else if (stock <= 80) {
        return 'low';
    } else {
        return 'available';
    }
};

// --- HELPER FUNCTION REMOVED ---
// The old getLatestPercentage helper is no longer needed with the simplified schema.

const createUpiTrade = async (req, res) => {
    const vendorId = req.user.user_id; // The person MAKING the purchase
    const { productId, no_of_stock_bought, transactionId } = req.body;
    const paymentScreenshotFile = req.file;

    if (!productId || !no_of_stock_bought || !transactionId) {
        return res.status(400).json({ message: 'Product ID, quantity, and transaction ID are required.' });
    }

    const quantity = parseInt(no_of_stock_bought, 10);
    const client = await db.connect();

    try {
        await client.query('BEGIN');
        
        // --- NEW, SIMPLIFIED LOGIC ---
        const vendorInfoRes = await client.query('SELECT referred_id FROM vendors WHERE id = $1', [vendorId]);
        const referrerId = vendorInfoRes.rows[0]?.referred_id || null;

        let commissionPercentage = null;
        if (referrerId) {
            // Directly select the single percentage value from the referrer's wallet.
            const percentageRes = await client.query('SELECT percentage FROM wallet WHERE id = $1', [referrerId]);
            if (percentageRes.rows.length > 0) {
                commissionPercentage = percentageRes.rows[0].percentage;
            }
        }
        // --- END OF NEW LOGIC ---

        const productRes = await client.query('SELECT price_per_slot, available_stock FROM product WHERE product_id = $1', [productId]);
        if (productRes.rows.length === 0) throw new Error('Product not found.');
        const product = productRes.rows[0];
        if (product.available_stock < quantity) throw new Error('Not enough stock available.');
        
        const totalAmount = parseFloat(product.price_per_slot) * quantity;
        const tradeId = uuidv4();

        let paymentScreenshotUrl = null;
        if (paymentScreenshotFile) {
            const proofFilename = `TP_${tradeId}${path.extname(paymentScreenshotFile.originalname)}`;
            paymentScreenshotUrl = await uploadFileToR2(paymentScreenshotFile, 'trade_proofs', proofFilename);
        }
        
        const insertQuery = `
            INSERT INTO trading (
                trade_id, vendor_id, product_id, no_of_stock_bought, price_per_slot, 
                total_amount_paid, is_approved, transaction_id, payment_url,
                referred_id, percentage, is_claimed, selling_days
            )
            VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, $10, FALSE, $11)`;
            
        await client.query(insertQuery, [
            tradeId, vendorId, productId, quantity, product.price_per_slot, 
            totalAmount, transactionId, paymentScreenshotUrl,
            referrerId, commissionPercentage, product.selling_days
        ]);
        
        await client.query('COMMIT');
        res.status(201).json({ message: 'Payment proof submitted successfully. Your purchase is pending approval.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error creating UPI trade:', error);
        res.status(500).json({ message: error.message || 'Server error while creating the trade.' });
    } finally {
        client.release();
    }
};

const executeWalletTrade = async (req, res) => {
    const vendorId = req.user.user_id;
    const { productId, no_of_stock_bought } = req.body;

    if (!productId || !no_of_stock_bought || parseInt(no_of_stock_bought, 10) <= 0) {
        return res.status(400).json({ message: 'A valid Product ID and quantity are required.' });
    }
    const quantity = parseInt(no_of_stock_bought, 10);
    const client = await db.connect();
    
    try {
        await client.query('BEGIN');
        
        // --- NEW, SIMPLIFIED LOGIC ---
        const vendorInfoRes = await client.query('SELECT referred_id FROM vendors WHERE id = $1', [vendorId]);
        const referrerId = vendorInfoRes.rows[0]?.referred_id || null;

        let commissionPercentage = null;
        if (referrerId) {
            // Directly select the single percentage value from the referrer's wallet.
            const percentageRes = await client.query('SELECT percentage FROM wallet WHERE id = $1', [referrerId]);
            if (percentageRes.rows.length > 0) {
                commissionPercentage = percentageRes.rows[0].percentage;
            }
        }
        // --- END OF NEW LOGIC ---

        const productRes = await client.query('SELECT paper_type, price_per_slot, available_stock, original_stock, selling_days FROM product WHERE product_id = $1 FOR UPDATE', [productId]);
        if (productRes.rows.length === 0) throw new Error('Product not found.');
        const product = productRes.rows[0];
        if (product.available_stock < quantity) throw new Error('Not enough stock available.');
        
        // Check if current time is in personal quota phase
        const isPersonalPhase = isInPersonalQuotaPhase();
        
        if (isPersonalPhase) {
            // In personal quota phase - enforce quota limits
            console.log('🔒 Personal quota phase active for product:', productId);
            
            // Get approved vendor count (join with login to check approval status)
            const vendorCountResult = await client.query(
                `SELECT COUNT(*) 
                 FROM vendors v
                 INNER JOIN login l ON v.id = l.user_id
                 WHERE l.is_approved = TRUE AND l.role = 'vendor'`
            );
            const vendorCount = parseInt(vendorCountResult.rows[0].count, 10);
            
            if (vendorCount > 0) {
                // Calculate total sold for this product
                const soldResult = await client.query(
                    `SELECT COALESCE(SUM(no_of_stock_bought), 0) as total_sold 
                     FROM trading 
                     WHERE product_id = $1`,
                    [productId]
                );
                const totalSold = parseInt(soldResult.rows[0].total_sold, 10);
                
                // Calculate original total stock
                const originalTotal = product.original_stock || (product.available_stock + totalSold);
                
                // Calculate fair share per vendor (rounded down)
                const fairSharePerVendor = Math.floor(originalTotal / vendorCount);
                
                // Get vendor's purchases for this product TODAY during current quota window only
                const { parseQuotaTimeSlotsFromEnv, getCurrentISTTime } = require('../utils/timeUtils');
                const quotaSlots = parseQuotaTimeSlotsFromEnv();
                const currentIST = getCurrentISTTime();
                const currentMinutes = currentIST.getHours() * 60 + currentIST.getMinutes();
                
                // Find which quota slot we're in
                let currentSlot = null;
                for (const slot of quotaSlots) {
                    const [startH, startM] = slot.start.split(':').map(Number);
                    const [endH, endM] = slot.end.split(':').map(Number);
                    const slotStart = startH * 60 + startM;
                    const slotEnd = endH * 60 + endM;
                    
                    let inSlot = false;
                    if (slotStart > slotEnd) {
                        inSlot = currentMinutes >= slotStart || currentMinutes <= slotEnd;
                    } else {
                        inSlot = currentMinutes >= slotStart && currentMinutes < slotEnd;
                    }
                    
                    if (inSlot) {
                        currentSlot = slot;
                        break;
                    }
                }
                
                // Build time range for today's quota window
                const today = new Date(currentIST.toDateString());
                let startTime, endTime;
                
                if (currentSlot) {
                    const [startH, startM] = currentSlot.start.split(':').map(Number);
                    const [endH, endM] = currentSlot.end.split(':').map(Number);
                    
                    startTime = new Date(today);
                    startTime.setHours(startH, startM, 0, 0);
                    
                    endTime = new Date(today);
                    endTime.setHours(endH, endM, 59, 999);
                    
                    // Handle slot crossing midnight
                    if (endH < startH) {
                        endTime.setDate(endTime.getDate() + 1);
                    }
                }
                
                console.log('📊 Quota window check:', {
                    currentSlot: currentSlot?.start + '-' + currentSlot?.end,
                    startTime: startTime?.toISOString(),
                    endTime: endTime?.toISOString()
                });
                
                // Get vendor's purchases ONLY from today's quota window
                const vendorPurchasedResult = await client.query(
                    `SELECT COALESCE(SUM(no_of_stock_bought), 0) as purchased 
                     FROM trading 
                     WHERE product_id = $1 
                       AND vendor_id = $2
                       AND date >= $3
                       AND date <= $4`,
                    [productId, vendorId, startTime, endTime]
                );
                const vendorPurchased = parseInt(vendorPurchasedResult.rows[0].purchased, 10);
                
                // Calculate remaining quota
                const vendorRemainingQuota = Math.max(0, fairSharePerVendor - vendorPurchased);
                
                console.log('📊 Quota check:', {
                    originalTotal,
                    vendorCount,
                    fairSharePerVendor,
                    vendorPurchasedTodayInWindow: vendorPurchased,
                    vendorRemainingQuota,
                    requestedQuantity: quantity
                });
                
                // Check if requested quantity exceeds quota
                if (quantity > vendorRemainingQuota) {
                    throw new Error(`Quota limit exceeded. You can purchase up to ${vendorRemainingQuota} more units of this product during the personal quota phase.`);
                }
            }
        }
        
        const totalAmount = parseFloat(product.price_per_slot) * quantity;
        
        const walletRes = await client.query('SELECT digital_money FROM wallet WHERE id = $1 FOR UPDATE', [vendorId]);
        if (walletRes.rows.length === 0 || parseFloat(walletRes.rows[0].digital_money) < totalAmount) {
            throw new Error('Insufficient funds in your digital wallet.');
        }

        const updatedWallet = await client.query('UPDATE wallet SET digital_money = digital_money - $1 WHERE id = $2 RETURNING digital_money', [totalAmount, vendorId]);
        const balanceAfterTransaction = updatedWallet.rows[0].digital_money;
        
        // Check and cancel withdrawals if insufficient balance
        const { cancelledWithdrawals } = await checkAndCancelWithdrawals(client, vendorId, balanceAfterTransaction);
        
        // Update stock and recalculate stock status
        const newStock = product.available_stock - quantity;
        const newStockStatus = calculateStockStatus(newStock);
        await client.query('UPDATE product SET available_stock = $1, stock_status = $2 WHERE product_id = $3', [newStock, newStockStatus, productId]);
        
        const tradeId = uuidv4();
        const insertQuery = `
            INSERT INTO trading (
                trade_id, vendor_id, product_id, no_of_stock_bought, price_per_slot, 
                total_amount_paid, is_approved, referred_id, percentage, is_claimed
            )
            VALUES ($1, $2, $3, $4, $5, $6, 'approved', $7, $8, FALSE)`;
        await client.query(insertQuery, [
            tradeId, vendorId, productId, quantity, product.price_per_slot, totalAmount,
            referrerId, commissionPercentage
        ]);

        const description = `Purchase of ${quantity} units of ${product.paper_type} (Trade ID: ${tradeId})`;
        await client.query(
            `INSERT INTO transaction (user_id, transaction_type, amount, status, description, balance_after_transaction)
             VALUES ($1, 'purchase', $2, 'approved', $3, $4)`,
            [vendorId, totalAmount, description, balanceAfterTransaction]
        );

        // Note: total_spent tracking removed as it's not part of the wallet table schema
        // Purchase tracking is handled through the transaction table instead

        await client.query('COMMIT');
        
        // Generate response message with withdrawal cancellation info
        let message = 'Purchase successful using your digital wallet!';
        const cancellationMessage = generateCancellationMessage(cancelledWithdrawals);
        if (cancellationMessage) {
            message += ` ${cancellationMessage}`;
        }
        
        res.status(200).json({ 
            message,
            cancelledWithdrawals: cancelledWithdrawals.length > 0 ? cancelledWithdrawals : undefined
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error executing wallet trade:', error);
        res.status(500).json({ message: error.message || 'Server error during wallet purchase.' });
    } finally {
        client.release();
    }
};

const submitProof = async (req, res) => {
    const { tradeId, transactionId } = req.body;
    const paymentScreenshotFile = req.file;

    if (!tradeId || !transactionId) {
        return res.status(400).json({ message: 'Trade ID and Transaction ID are required.' });
    }
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const tradeCheckRes = await client.query('SELECT is_approved, payment_url FROM trading WHERE trade_id = $1 FOR UPDATE', [tradeId]);
        if (tradeCheckRes.rows.length === 0) throw new Error('Pending trade not found.');
        
        const currentTrade = tradeCheckRes.rows[0];
        if (currentTrade.is_approved) throw new Error('This trade has already been approved and cannot be modified.');
        if (currentTrade.payment_url) throw new Error('Payment proof has already been submitted for this trade.');

        let paymentScreenshotUrl = null;
        if (paymentScreenshotFile) {
            const proofFilename = `TP_${tradeId}${path.extname(paymentScreenshotFile.originalname)}`;
            paymentScreenshotUrl = await uploadFileToR2(paymentScreenshotFile, 'trade_proofs', proofFilename);
        }

        await client.query(`UPDATE trading SET transaction_id = $1, payment_url = $2 WHERE trade_id = $3`, [transactionId, paymentScreenshotUrl, tradeId]);
        await client.query('COMMIT');
        res.status(200).json({ message: 'Payment proof submitted successfully. Your purchase is pending approval.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error submitting payment proof:', error);
        res.status(500).json({ message: 'Server error while submitting proof. Please try again.' });
    } finally {
        client.release();
    }
};

// const sellProduct = async (req, res) => {
//     const vendorId = req.user.user_id;
//     const { trade_id } = req.body; 

//     if (!trade_id) {
//         return res.status(400).json({ message: 'Trade ID is required to sell.' });
//     }

//     const client = await db.connect();
//     try {
//         await client.query('BEGIN');
//         const tradeRes = await client.query(
//             `SELECT t.*, p.paper_type, p.selling_price 
//              FROM trading t 
//              JOIN product p ON t.product_id = p.product_id
//              WHERE t.trade_id = $1 AND t.vendor_id = $2 FOR UPDATE`,
//             [trade_id, vendorId]
//         );

//         if (tradeRes.rows.length === 0) throw new Error('Trade not found or you do not have permission to sell it.');
        
//         const trade = tradeRes.rows[0];
//         if (trade.is_sold) throw new Error('This item has already been sold.');
//         if (trade.is_approved !== 'approved') throw new Error('This item is not yet approved for sale.');

//         // Determine sell price
//         const currentSellingPrice = parseFloat(trade.selling_price);
//         const now = new Date();
//         const boughtDate = new Date(trade.date);
//         const daysSinceBought = (now - boughtDate) / (1000 * 60 * 60 * 24);
        
//         // Fix: Use the purchase price as the selling price since that's what the vendor should receive
//         // The vendor bought at price_per_slot and should sell at the same price
//         const sellPrice = parseFloat(trade.price_per_slot);

//         const totalMoneyFromSale = Number(trade.no_of_stock_bought) * finalSellPrice;

//         // Mark trade as sold, set price & sale timestamp
//         await client.query(
//           `UPDATE trading
//              SET is_sold = TRUE,
//                  sold_at = $1,
//                  sold_on = NOW()         -- ✅ record sale date/time
//            WHERE trade_id = $2`,
//           [sellPrice, trade.trade_id]
//         );

//         // Credit wallet
//         let updatedWallet;
//         const walletRes = await client.query(
//           'SELECT 1 FROM wallet WHERE id = $1 FOR UPDATE',
//           [vendorId]
//         );

//         if (walletRes.rows.length === 0) {
//           const idRes = await client.query(
//             `SELECT wallet_id
//                FROM wallet
//                ORDER BY CAST(SUBSTRING(wallet_id FROM 3) AS INTEGER) DESC
//                LIMIT 1`
//           );
//           let nextNum = 1;
//           if (idRes.rows.length > 0 && idRes.rows[0].wallet_id) {
//             const lastIdNum = parseInt(idRes.rows[0].wallet_id.split('_')[1], 10);
//             if (!isNaN(lastIdNum)) nextNum = lastIdNum + 1;
//           }
//           const walletId = `w_${String(nextNum).padStart(3, '0')}`;
//           updatedWallet = await client.query(
//             'INSERT INTO wallet (wallet_id, id, digital_money) VALUES ($1, $2, $3) RETURNING digital_money',
//             [walletId, vendorId, totalMoneyFromSale]
//           );
//         } else {
//           updatedWallet = await client.query(
//             'UPDATE wallet SET digital_money = digital_money + $1 WHERE id = $2 RETURNING digital_money',
//             [totalMoneyFromSale, vendorId]
//           );
//         }

//         const balanceAfterTransaction = Number(updatedWallet.rows[0].digital_money);

//         // Record transaction
//         const description = `Sale of ${trade.no_of_stock_bought} units of ${trade.paper_type} (Trade ID: ${trade_id})`;
//         await client.query(
//           `INSERT INTO transaction
//              (user_id, transaction_type, amount, status, description, balance_after_transaction)
//            VALUES ($1, 'sale', $2, 'approved', $3, $4)`,
//           [vendorId, totalMoneyFromSale, description, balanceAfterTransaction]
//         );

//         // Return the sold item (now includes sold_on)
//         const soldItemRes = await client.query('SELECT * FROM trading WHERE trade_id = $1', [trade_id]);

//         await client.query('COMMIT');

//         res.status(200).json({
//           message: 'Item sold successfully!',
//           digital_money: balanceAfterTransaction,
//           sold_trade: soldItemRes.rows[0]
//         });
//     } catch (error) {
//         await client.query('ROLLBACK');
//         console.error('❌ Error selling product:', error);
//         res.status(500).json({ message: error.message || 'Server error while trying to sell the item.' });
//     } finally {
//         client.release();
//     }
// };

// const getActiveTrades = async (req, res) => {
//     const vendorId = req.user.user_id;
//     try {
//         const query = `
//             SELECT t.trade_id, t.product_id, t.no_of_stock_bought,
//                    t.price_per_slot AS purchase_price, t.is_approved, t.is_sold,
//                    (t.date AT TIME ZONE 'Asia/Kolkata') AS purchase_date, p.paper_type, p.product_image_url,
//                    p.selling_price AS current_selling_price
//             FROM trading AS t
//             LEFT JOIN product AS p ON t.product_id = p.product_id
//             WHERE t.vendor_id = $1 AND t.is_approved = 'approved' AND (t.is_sold IS NULL OR t.is_sold = FALSE)
//             ORDER BY t.date DESC;
//         `;
//         const result = await db.query(query, [vendorId]);
//         res.status(200).json(result.rows);
//     } catch (error) {
//         console.error('❌ Error fetching active trades:', error);
//         res.status(500).json({ message: 'Server error while fetching active trades.' });
//     }
// };

const sellProduct = async (req, res) => {
  const vendorId = req.user.user_id;
  const { trade_id, selling_price } = req.body;

  if (!trade_id) {
    return res.status(400).json({ message: 'Trade ID is required to sell.' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // First, lock the trade row
    const tradeRes = await client.query(
      `SELECT * FROM trading WHERE trade_id = $1 AND vendor_id = $2 FOR UPDATE`,
      [trade_id, vendorId]
    );
    
    if (tradeRes.rows.length === 0) {
      throw new Error('Trade not found or you do not have permission to sell it.');
    }
    
    const trade = tradeRes.rows[0];
    
    // Then fetch product info separately (both regular and wild products)
    const productInfoRes = await client.query(
      `SELECT 
              CASE 
                  WHEN $1 LIKE 'WP_%' THEN wp.product_name
                  ELSE p.paper_type
              END AS paper_type, 
              CASE 
                  WHEN $1 LIKE 'WP_%' THEN wp.selling_price
                  ELSE p.selling_price
              END AS selling_price,
              CASE 
                  WHEN $1 LIKE 'WP_%' THEN wp.selling_date_count
                  ELSE COALESCE(t.selling_days, p.selling_days, 7)
              END AS selling_date_count
       FROM trading t
       LEFT JOIN product p ON t.product_id = p.product_id AND $1 NOT LIKE 'WP_%'
       LEFT JOIN wild_products wp ON t.product_id = wp.wild_product_id AND $1 LIKE 'WP_%'
       WHERE t.trade_id = $2 AND t.vendor_id = $3`,
      [trade.product_id, trade_id, vendorId]
    );
    
    const productInfo = productInfoRes.rows[0];
    
    if (trade.is_sold) throw new Error('This item has already been sold.');
    if (trade.is_approved !== 'approved') throw new Error('This item is not yet approved for sale.');

    // Determine sell price - use provided selling_price or default to product's selling_price
    const selectedSellingPrice = selling_price ? parseFloat(selling_price) : parseFloat(productInfo.selling_price);
    const now = new Date();
    const boughtDate = new Date(trade.date);
    const daysSinceBought = (now - boughtDate) / (1000 * 60 * 60 * 24);
    
    // Calculate selling price based on business rules:
    // - If less than selling_date_count days: sell at purchase price (no profit/loss)
    // - If selling_date_count+ days: sell at selected market price (potential profit/loss)
    // - NEW: From day 9 onwards, add ₹1 per day per stock as bonus
    const sellingDateCount = parseInt(productInfo.selling_date_count) || 7; // Default to 7 for regular products
    let finalSellPrice;
    let bonusAmount = 0;
    
    if (daysSinceBought < sellingDateCount) {
      finalSellPrice = parseFloat(trade.price_per_slot); // No profit/loss if sold within selling_date_count days
    } else {
      finalSellPrice = selectedSellingPrice; // Use selected market price for potential profit/loss
    }
    
    // Calculate daily bonus from (selling_days + 2) onwards (capped at ₹2 per stock max)
    const bonusStartDay = sellingDateCount + 2; // Bonus starts from selling_days + 2
    if (daysSinceBought >= bonusStartDay) {
      const daysBeyondBonusStart = Math.floor(daysSinceBought) - (bonusStartDay - 1); // Days beyond bonus start day
      // Cap bonus at ₹2 per stock maximum
      const cappedBonusDays = Math.min(daysBeyondBonusStart, 2); // Maximum 2 days of bonus
      bonusAmount = cappedBonusDays * parseFloat(trade.no_of_stock_bought); // ₹1 per day per stock
      finalSellPrice += bonusAmount / parseFloat(trade.no_of_stock_bought); // Add bonus to per-unit price
    }
    
    // Debug logging for wild products
    if (trade.product_id && trade.product_id.startsWith('WP_')) {
        console.log('🔍 Wild Product Selling Debug:', {
            product_id: trade.product_id,
            paper_type: productInfo.paper_type,
            selling_date_count: productInfo.selling_date_count,
            daysSinceBought: daysSinceBought,
            sellingDateCount: sellingDateCount,
            bonusStartDay: bonusStartDay,
            purchasePrice: trade.price_per_slot,
            currentSellingPrice: selectedSellingPrice,
            finalSellPrice: finalSellPrice,
            bonusAmount: bonusAmount,
            cappedBonusDays: Math.min(Math.floor(daysSinceBought) - (bonusStartDay - 1), 2),
            isWithinSellingPeriod: daysSinceBought < sellingDateCount
        });
    }

    const totalMoneyFromSale = Number(trade.no_of_stock_bought) * finalSellPrice;

    // Mark trade as sold, set price & sale timestamp
        await client.query(
          `UPDATE trading
             SET is_sold = TRUE,
                 sold_at = $1,
                 sold_on = NOW()         -- ✅ record sale date/time
           WHERE trade_id = $2`,
          [finalSellPrice, trade.trade_id]
        );

    // Credit wallet
    let updatedWallet;
    const walletRes = await client.query(
      'SELECT 1 FROM wallet WHERE id = $1 FOR UPDATE',
      [vendorId]
    );

    if (walletRes.rows.length === 0) {
      const idRes = await client.query(
        `SELECT wallet_id
           FROM wallet
           ORDER BY CAST(SUBSTRING(wallet_id FROM 3) AS INTEGER) DESC
           LIMIT 1`
      );
      let nextNum = 1;
      if (idRes.rows.length > 0 && idRes.rows[0].wallet_id) {
        const lastIdNum = parseInt(idRes.rows[0].wallet_id.split('_')[1], 10);
        if (!isNaN(lastIdNum)) nextNum = lastIdNum + 1;
      }
      const walletId = `w_${String(nextNum).padStart(3, '0')}`;
      updatedWallet = await client.query(
        'INSERT INTO wallet (wallet_id, id, digital_money) VALUES ($1, $2, $3) RETURNING digital_money',
        [walletId, vendorId, totalMoneyFromSale]
      );
    } else {
      updatedWallet = await client.query(
        'UPDATE wallet SET digital_money = digital_money + $1 WHERE id = $2 RETURNING digital_money',
        [totalMoneyFromSale, vendorId]
      );
    }

    const balanceAfterTransaction = Number(updatedWallet.rows[0].digital_money);

    // Record transaction
    let description = `Sale of ${trade.no_of_stock_bought} units of ${productInfo.paper_type} (Trade ID: ${trade_id})`;
    
    // Add bonus information to description if there's a bonus
    if (bonusAmount > 0) {
      const bonusDays = Math.floor(daysSinceBought) - 8;
      description += ` - Bonus: ₹${bonusAmount} (${bonusDays} days held beyond day 8)`;
    }
    
    await client.query(
      `INSERT INTO transaction
         (user_id, transaction_type, amount, status, description, balance_after_transaction)
       VALUES ($1, 'sale', $2, 'approved', $3, $4)`,
      [vendorId, totalMoneyFromSale, description, balanceAfterTransaction]
    );

    // Return the sold item (now includes sold_on)
    const soldItemRes = await client.query('SELECT * FROM trading WHERE trade_id = $1', [trade_id]);

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Item sold successfully!',
      digital_money: balanceAfterTransaction,
      sold_trade: soldItemRes.rows[0],
      bonus_amount: bonusAmount,
      has_bonus: bonusAmount > 0,
      days_held: Math.floor(daysSinceBought)
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error selling product:', error);
    res.status(500).json({ message: error.message || 'Server error while trying to sell the item.' });
  } finally {
    client.release();
  }
};


const getActiveTrades = async (req, res) => {
    // Using req.user.user_id as in your original code
    const vendorId = req.user.user_id;

    try {
        // --- This is the updated query ---
        const query = `
            SELECT 
                t.trade_id, 
                t.product_id, 
                t.no_of_stock_bought,
                t.price_per_slot AS purchase_price, 
                t.is_approved,
                t.is_sold,
                t.date AS purchase_date, 
                CASE 
                    WHEN t.product_id LIKE 'WP_%' THEN wp.product_name
                    ELSE p.paper_type
                END AS paper_type,
                CASE 
                    WHEN t.product_id LIKE 'WP_%' THEN wp.product_image_url
                    ELSE p.product_image_url
                END AS product_image_url,
                CASE 
                    WHEN t.product_id LIKE 'WP_%' THEN wp.selling_price
                    ELSE p.selling_price
                END AS current_selling_price,
                CASE 
                    WHEN t.product_id LIKE 'WP_%' THEN COALESCE(wp.selling_price_2, wp.selling_price)
                    ELSE COALESCE(p.selling_price_2, p.selling_price)
                END AS current_selling_price_2,
                CASE 
                    WHEN t.product_id LIKE 'WP_%' THEN COALESCE(wp.selling_price_3, wp.selling_price)
                    ELSE COALESCE(p.selling_price_3, p.selling_price)
                END AS current_selling_price_3,

                -- 1. Calculate lock status: use trading.selling_days for regular products, wp.selling_date_count for wild products
                CASE 
                    WHEN t.product_id LIKE 'WP_%' THEN (NOW() < (t.date + COALESCE(wp.selling_date_count, 30) * INTERVAL '1 day'))
                    ELSE (NOW() < (t.date + COALESCE(t.selling_days, p.selling_days, 7) * INTERVAL '1 day'))
                END AS is_locked,

                -- 2. Calculate unlock timestamp: use trading.selling_days for regular products, wp.selling_date_count for wild products
                CASE 
                    WHEN t.product_id LIKE 'WP_%' THEN EXTRACT(EPOCH FROM (t.date + COALESCE(wp.selling_date_count, 30) * INTERVAL '1 day')) * 1000
                    ELSE EXTRACT(EPOCH FROM (t.date + COALESCE(t.selling_days, p.selling_days, 7) * INTERVAL '1 day')) * 1000
                END AS unlock_timestamp_utc

            FROM 
                trading AS t
            LEFT JOIN 
                product AS p ON t.product_id = p.product_id
            LEFT JOIN 
                wild_products AS wp ON t.product_id = wp.wild_product_id AND t.product_id LIKE 'WP_%'
            WHERE 
                t.vendor_id = $1 
                AND t.is_approved = 'approved' 
                AND (t.is_sold IS NULL OR t.is_sold = FALSE)
            ORDER BY 
                t.date DESC;
        `;
        // --- End of updated query ---

        const result = await db.query(query, [vendorId]);

        // Debug logging for all products (regular and wild)
        console.log('🔍 Active trades fetched:', result.rows.length);
        result.rows.forEach((trade, index) => {
            const productType = trade.product_id && trade.product_id.startsWith('WP_') ? 'Wild Product' : 'Regular Product';
            console.log(`🔍 ${productType} ${index + 1}:`, {
                product_id: trade.product_id,
                paper_type: trade.paper_type,
                is_locked: trade.is_locked,
                unlock_timestamp_utc: trade.unlock_timestamp_utc,
                purchase_date: trade.purchase_date,
                current_time: new Date().toISOString(),
                unlock_time: new Date(parseInt(trade.unlock_timestamp_utc)).toISOString()
            });
        });

        // The response will now automatically include the new 'is_locked' 
        // and 'unlock_timestamp_utc' fields for every trade.
        res.status(200).json(result.rows);

    } catch (error) {
        console.error('❌ Error fetching active trades:', error);
        res.status(500).json({ message: 'Server error while fetching active trades.' });
    }
};

// Make sure to export the function if it's in a controller file
// module.exports = { getActiveTrades, ... };

// const getSoldTrades = async (req, res) => {
//     const vendorId = req.user.user_id;
//     try {
//         const query = `
//             SELECT t.trade_id, t.product_id, t.no_of_stock_bought,
//                    t.price_per_slot AS purchase_price, t.sold_at AS sale_price,
//                    (t.date AT TIME ZONE 'Asia/Kolkata') AS purchase_date, p.paper_type, p.product_image_url
//             FROM trading AS t
//             LEFT JOIN product AS p ON t.product_id = p.product_id
//             WHERE t.vendor_id = $1 AND t.is_sold = TRUE
//             ORDER BY t.date DESC;
//         `;
//         const result = await db.query(query, [vendorId]);
//         res.status(200).json(result.rows);
//     } catch (error) {
//         console.error('❌ Error fetching sold trades:', error);
//         res.status(500).json({ message: 'Server error while fetching trade history.' });
//     }
// };

const getSoldTrades = async (req, res) => {
  const vendorId = req.user.user_id;
  try {
    const query = `
      SELECT
        t.trade_id,
        t.product_id,
        t.no_of_stock_bought,
        t.price_per_slot AS purchase_price,
        t.sold_at        AS sale_price,
        t.date::date AS purchase_date,
        CASE
            WHEN t.product_id LIKE 'WP_%' THEN COALESCE(t.sold_on::date, (t.date::date + wp.selling_date_count * INTERVAL '1 day')::date)
            ELSE COALESCE(t.sold_on::date, (t.date::date + COALESCE(t.selling_days, p.selling_days, 7) * INTERVAL '1 day')::date)
        END AS sale_date,
        CASE 
            WHEN t.product_id LIKE 'WP_%' THEN wp.product_name
            ELSE p.paper_type
        END AS paper_type,
        CASE 
            WHEN t.product_id LIKE 'WP_%' THEN wp.product_image_url
            ELSE p.product_image_url
        END AS product_image_url
      FROM trading AS t
      LEFT JOIN product AS p ON t.product_id = p.product_id
      LEFT JOIN wild_products AS wp ON t.product_id = wp.wild_product_id AND t.product_id LIKE 'WP_%'
      WHERE t.vendor_id = $1
        AND t.is_sold = TRUE
      ORDER BY t.date DESC;
    `;
    const result = await db.query(query, [vendorId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching sold trades:', error);
    res.status(500).json({ message: 'Server error while fetching trade history.' });
  }
};


const getPurchaseHistory = async (req, res) => {
    const vendorId = req.user.user_id;
    try {
        const query = `
            SELECT t.trade_id, t.product_id, t.no_of_stock_bought,
                   t.total_amount_paid, t.is_approved, t.date, t.transaction_id, t.comment,
                   CASE 
                       WHEN t.product_id LIKE 'WP_%' THEN wp.product_name
                       ELSE p.paper_type
                   END AS paper_type, 
                   CASE 
                       WHEN t.product_id LIKE 'WP_%' THEN wp.product_image_url
                       ELSE p.product_image_url
                   END AS product_image_url
            FROM trading AS t
            LEFT JOIN product AS p ON t.product_id = p.product_id
            LEFT JOIN wild_products AS wp ON t.product_id = wp.wild_product_id AND t.product_id LIKE 'WP_%'
            WHERE t.vendor_id = $1
            ORDER BY t.date DESC;
        `;
        const historyResult = await db.query(query, [vendorId]);
        res.status(200).json(historyResult.rows);
    } catch (error) {
        console.error('❌ Error fetching purchase history:', error);
        res.status(500).json({ message: 'Server error while fetching your purchase history.' });
    }
};

const getRejectedTrades = async (req, res) => {
    const vendorId = req.user.user_id;
    try {
        const query = `
            SELECT t.trade_id, t.product_id, t.date AS purchase_date, t.comment,
                   CASE 
                       WHEN t.product_id LIKE 'WP_%' THEN wp.product_name
                       ELSE p.paper_type
                   END AS paper_type, 
                   CASE 
                       WHEN t.product_id LIKE 'WP_%' THEN wp.product_image_url
                       ELSE p.product_image_url
                   END AS product_image_url
            FROM trading AS t
            LEFT JOIN product AS p ON t.product_id = p.product_id
            LEFT JOIN wild_products AS wp ON t.product_id = wp.wild_product_id AND t.product_id LIKE 'WP_%'
            WHERE t.vendor_id = $1 AND t.is_approved = 'rejected'
            ORDER BY t.date DESC;
        `;
        const result = await db.query(query, [vendorId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching rejected trades:', error);
        res.status(500).json({ message: 'Server error while fetching rejected trades.' });
    }
};

// Calculate total profit from all sold trades for a user
const calculateTotalProfit = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    // Get all sold trades for the user using the same query as getSoldTrades
    const soldTrades = await db.query(`
      SELECT
        t.price_per_slot AS purchase_price,
        t.sold_at AS sale_price,
        t.no_of_stock_bought
      FROM trading AS t
      WHERE t.vendor_id = $1 AND t.is_sold = TRUE
    `, [userId]);

    let totalProfit = 0;
    let totalTrades = soldTrades.rows ? soldTrades.rows.length : 0;

    // Calculate profit for each trade
    if (soldTrades.rows) {
      soldTrades.rows.forEach(trade => {
        const purchasePrice = parseFloat(trade.purchase_price) || 0;
        const salePrice = parseFloat(trade.sale_price) || 0;
        const stocks = parseInt(trade.no_of_stock_bought) || 0;
        
        if (purchasePrice > 0 && salePrice > 0 && stocks > 0) {
          const profitPerStock = salePrice - purchasePrice;
          const tradeProfit = profitPerStock * stocks;
          totalProfit += tradeProfit;
        }
      });
    }

    res.json({
      success: true,
      totalProfit: parseFloat(totalProfit.toFixed(2)),
      totalTrades,
      message: 'Total profit calculated successfully'
    });

  } catch (error) {
    console.error('Error calculating total profit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate total profit',
      error: error.message
    });
  }
};

module.exports = {
    createUpiTrade,
    executeWalletTrade,
    submitProof,
    sellProduct,
    getActiveTrades,
    getSoldTrades,
    getRejectedTrades,
    getPurchaseHistory,
    calculateTotalProfit
};
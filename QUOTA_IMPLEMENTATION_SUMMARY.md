# Product Quota System - Implementation Summary

## What Was Implemented

A **Personal Quota Allocation System** for regular products (NOT wild products) that ensures fair distribution among all vendors.

### Key Features

✅ **Fair Distribution:** Each vendor gets equal quota calculated as `Math.floor(total_stock / active_vendors)`  
✅ **Fixed Quotas:** Your quota doesn't shrink when other vendors buy  
✅ **Two-Phase System:** Personal quota phase → Shared pool phase  
✅ **Automatic Detection:** System auto-detects which phase based on time  
✅ **Wild Products Unchanged:** Wild products remain first-come-first-served  

## How It Works

### Scenario: 500 Units Released at 6:30 AM

**10 Active Vendors:**
- Each vendor quota: `Math.floor(500 / 10)` = **50 units**

**Personal Quota Phase (6:30-7:00 AM):**
```
Vendor A sees: "Your quota: 50 units"
Vendor B sees: "Your quota: 50 units"
...all vendors see: 50 units each

Vendor A buys 30 units
Vendor A now sees: "Your quota: 20 units (30 purchased)"
Vendor B still sees: "Your quota: 50 units" ← Unaffected!

Vendor A tries to buy 25 units → REJECTED (only 20 remaining)
Vendor B buys 50 units → ALLOWED (within quota)
```

**Shared Pool Phase (7:00 AM onwards):**
```
Current stock: 370 units (500 - 130 sold)

All vendors see: "370 units available (shared pool)"
No quota restrictions
First-come-first-served
Anyone can buy any amount
```

## Files Modified

### 1. **Database Migration**
- **File:** `add_quota_columns_to_products.sql`
- **Changes:** Added `original_stock` and `release_time` columns to `product` table

### 2. **Time Utilities**
- **File:** `backend/api/utils/timeUtils.js`
- **New Functions:**
  - `parseQuotaTimeSlotsFromEnv()` - Parse quota time slots from ENV
  - `isInPersonalQuotaPhase(releaseTime)` - Check if product in quota phase
  - `getQuotaPhaseInfo(releaseTime)` - Get quota phase details

### 3. **Product Controller**
- **File:** `backend/api/controllers/productController.js`
- **Changes:**
  - `getAvailableProducts()` - Calculate and return quota info for each product
  - `addProduct()` - Set `original_stock` and `release_time` on new products
  - `updateProduct()` - Reset quota cycle when restocking (stock increases)

### 4. **Trading Controller**
- **File:** `backend/api/controllers/tradingController.js`
- **Changes:**
  - `executeWalletTrade()` - Validate quota limits during personal phase
  - Reject purchases that exceed vendor's remaining quota

## Configuration Required

### Step 1: Add ENV Variables

Add to `backend/.env`:

```bash
# Existing - Products display hours
PRODUCT_DISPLAY_TIME_SLOTS="06:30-13:00,14:00-18:15,19:15-05:00"

# NEW - Personal quota windows (30 minutes each)
INDIVIDUAL_QUOTA_TIME_SLOTS="06:30-07:00,14:00-14:30,19:15-19:45"
```

### Step 2: Run Database Migration

```bash
psql -U your_user -d your_database -f add_quota_columns_to_products.sql
```

### Step 3: Restart Backend

```bash
cd backend
npm run dev
```

## API Response Structure

### Product in Personal Quota Phase

```json
{
  "product_id": "P_001",
  "paper_type": "A4 Bond",
  "available_stock": 450,
  "original_stock": 500,
  "release_time": "2025-10-10T06:30:00Z",
  "quota_phase": "personal_quota",
  "vendor_quota": 50,
  "vendor_purchased": 30,
  "vendor_remaining_quota": 20,
  "price_per_slot": 100
}
```

**Display to Vendor:**
```
Product A - A4 Bond Paper
Available: 450 units in stock
Your Personal Quota: 20 / 50 units
(You've purchased 30 units)

⏱️ Quota phase ends in 15 minutes
```

### Product in Shared Pool Phase

```json
{
  "product_id": "P_001",
  "paper_type": "A4 Bond",
  "available_stock": 350,
  "original_stock": 500,
  "release_time": "2025-10-10T06:30:00Z",
  "quota_phase": "shared_pool",
  "vendor_quota": null,
  "vendor_purchased": null,
  "vendor_remaining_quota": null,
  "price_per_slot": 100
}
```

**Display to Vendor:**
```
Product A - A4 Bond Paper
Available: 350 units

🌐 Shared Pool - First Come First Served
```

## Error Handling

### Quota Exceeded Error

When vendor tries to buy more than remaining quota:

```json
{
  "message": "Quota limit exceeded. You can purchase up to 20 more units of this product during the personal quota phase."
}
```

### No Vendor Count

If no active vendors exist, system defaults to shared pool phase.

## Important Implementation Details

### 1. Quota Calculation Logic

```javascript
// Get total sold
const totalSold = SUM(all purchases for this product);

// Calculate original total
const originalTotal = product.original_stock || (current_stock + totalSold);

// Calculate fair share (rounded DOWN)
const fairShare = Math.floor(originalTotal / vendorCount);

// Calculate vendor's remaining quota
const vendorPurchased = SUM(this vendor's purchases for this product);
const remainingQuota = Math.max(0, fairShare - vendorPurchased);
```

### 2. Phase Detection

```javascript
// Product released at 6:35 AM
// Current quota slot: 6:30-7:00

if (releaseTime is within quota slot && currentTime is within same slot && same day) {
  phase = 'personal_quota'
} else {
  phase = 'shared_pool'
}
```

### 3. Restocking Behavior

When stock increases (restocking):
```javascript
if (newStock > oldStock) {
  // Reset quota cycle
  original_stock = newStock
  release_time = NOW()
  // New quota phase starts
}
```

### 4. Wild Products

Wild products are **NOT affected** by this system:
- No quota phases
- Always first-come-first-served
- Display logic unchanged

## Testing Checklist

### Test 1: Personal Quota Phase

- [ ] Add product with 500 units at 6:30 AM
- [ ] Verify 10 active vendors exist
- [ ] Check each vendor sees quota of 50 units
- [ ] Vendor A buys 30 units
- [ ] Verify Vendor A sees 20 remaining quota
- [ ] Verify Vendor B still sees 50 quota (unaffected)
- [ ] Try Vendor A buying 25 units → should be rejected
- [ ] Try Vendor A buying 20 units → should succeed

### Test 2: Shared Pool Phase

- [ ] Wait until 7:00 AM (quota window ends)
- [ ] Verify all vendors see same total stock
- [ ] Verify no quota restrictions
- [ ] Any vendor can buy any amount (subject to stock)

### Test 3: Restocking

- [ ] Update product stock from 100 to 500
- [ ] Verify `original_stock` reset to 500
- [ ] Verify `release_time` updated to NOW
- [ ] Verify new quota cycle starts (if in quota window)

### Test 4: Wild Products

- [ ] Verify wild products have no quota system
- [ ] All wild products show as first-come-first-served
- [ ] No quota_phase field in wild product responses

## Frontend Implementation Notes

The frontend will need to:

1. **Display Quota Info**
   ```jsx
   if (product.quota_phase === 'personal_quota') {
     return (
       <div>
         <p>Your Quota: {product.vendor_remaining_quota} / {product.vendor_quota}</p>
         <p>Purchased: {product.vendor_purchased}</p>
         <Badge>Personal Quota Phase</Badge>
       </div>
     )
   } else {
     return (
       <div>
         <p>Available: {product.available_stock} units</p>
         <Badge>Shared Pool</Badge>
       </div>
     )
   }
   ```

2. **Handle Quota Errors**
   ```jsx
   try {
     await purchaseProduct(productId, quantity);
   } catch (error) {
     if (error.message.includes('Quota limit exceeded')) {
       // Show quota exceeded message
       // Suggest maximum purchaseable amount
     }
   }
   ```

3. **Show Phase Timer**
   ```jsx
   // Calculate time remaining in quota phase
   const quotaEndTime = // calculate from quota slots
   const timeRemaining = quotaEndTime - currentTime
   
   if (timeRemaining > 0 && product.quota_phase === 'personal_quota') {
     return <Timer>Quota phase ends in {timeRemaining} minutes</Timer>
   }
   ```

## Benefits of This System

✅ **Fairness:** Every vendor gets equal opportunity regardless of internet speed  
✅ **Predictability:** Vendors know their quota upfront  
✅ **No Race Condition:** No need to rush during quota phase  
✅ **Flexibility:** After quota phase, fast vendors can still buy more  
✅ **Simple:** No complex allocation tables, all calculated on-the-fly  
✅ **Performance:** Efficient queries with proper indexing  

## Monitoring & Logs

Watch for these log messages:

```
🔒 Personal quota phase active for product: P_001

📊 Quota check: {
  originalTotal: 500,
  vendorCount: 10,
  fairSharePerVendor: 50,
  vendorPurchased: 30,
  vendorRemainingQuota: 20,
  requestedQuantity: 25
}

📦 Restocking product P_001: 100 → 500, resetting quota cycle
```

## Support & Troubleshooting

### Issue: Vendors see 0 quota
**Solution:** 
- Check `INDIVIDUAL_QUOTA_TIME_SLOTS` in ENV
- Verify vendor status is 'active'
- Ensure product has `original_stock` set

### Issue: Quota not resetting after restock
**Solution:**
- Verify stock increase detected (new > old)
- Check for "Restocking product" log message

### Issue: Wrong phase detection
**Solution:**
- Verify IST timezone conversion
- Check quota slots are within display slots
- Ensure same-day check is working

## Documentation Files

- `PRODUCT_QUOTA_SYSTEM.md` - Complete system documentation
- `QUOTA_ENV_CONFIGURATION.txt` - ENV variable configuration guide
- `add_quota_columns_to_products.sql` - Database migration script
- `QUOTA_IMPLEMENTATION_SUMMARY.md` - This file

---

**Implementation Complete! 🎉**

The system is ready to use. Add the ENV variables, run the migration, and restart the server to activate the quota system.


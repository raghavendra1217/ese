# Product Personal Quota System

## Overview

The Personal Quota System ensures fair distribution of products among all vendors. During designated "personal quota" time windows, each vendor gets an equal share of the available stock. After the quota window ends, products enter a "shared pool" phase where it's first-come-first-served.

## How It Works

### Phase 1: Personal Quota (First 30 minutes of each window)

**Example:** 500 units of Product A are released at 6:30 AM with 10 active vendors.

1. **Fair Share Calculation:**
   - Original Stock: 500 units
   - Active Vendors: 10
   - Quota per vendor: `Math.floor(500 / 10)` = **50 units each**

2. **Vendor Display:**
   - Vendor A sees: "50 units available (your personal quota)"
   - Vendor B sees: "50 units available (your personal quota)"
   - All vendors see their individual quota

3. **Purchase Tracking:**
   - If Vendor A buys 30 units, they have 20 remaining
   - Other vendors still have their full 50-unit quota
   - Quotas DON'T shrink when others buy

4. **Quota Calculation Logic:**
   ```
   Original Total = Current Stock + Total Sold
   Fair Share = Math.floor(Original Total / Vendor Count)
   Remaining Quota = Fair Share - Vendor's Purchased Amount
   ```

5. **Purchase Validation:**
   - Vendor tries to buy X units
   - System checks: `X <= Remaining Quota`
   - If exceeds: Reject with error message
   - If within quota: Allow purchase

### Phase 2: Shared Pool (After 30 minutes)

1. **No Quota Limits:**
   - All vendors see total available stock
   - First-come-first-served
   - No purchase restrictions

2. **Example:**
   - 450 units remain (after some vendors bought during quota phase)
   - All vendors see: "450 units available (shared pool)"
   - Anyone can buy any amount (subject to availability)

## Time Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Display time slots (when products are visible)
PRODUCT_DISPLAY_TIME_SLOTS="06:30-13:00,14:00-18:15,19:15-05:00"

# Personal quota time slots (30-min windows for fair allocation)
INDIVIDUAL_QUOTA_TIME_SLOTS="06:30-07:00,14:00-14:30,19:15-19:45"
```

### Time Slot Rules

- **Quota slots MUST be within display slots**
- Products are visible during ALL display hours
- Only purchase rules change (quota vs. shared)
- Quota windows are typically 30 minutes
- After quota window ends, same products become shared pool

### Example Schedule

| Time | Phase | What Happens |
|------|-------|--------------|
| 06:30 - 07:00 | Personal Quota | Each vendor gets equal quota |
| 07:00 - 13:00 | Shared Pool | First-come-first-served |
| 14:00 - 14:30 | Personal Quota | New quota window (if new products added) |
| 14:30 - 18:15 | Shared Pool | First-come-first-served |
| 19:15 - 19:45 | Personal Quota | Evening quota window |
| 19:45 - 05:00 | Shared Pool | Overnight shared pool |

## Database Schema

### New Column Required in `product` Table

You need to manually add this column to your `product` table:

```sql
-- Add original_stock column to track initial quantity for quota calculation
ALTER TABLE product ADD COLUMN original_stock BIGINT;

-- Update existing products to set original_stock to current available_stock
UPDATE product SET original_stock = available_stock WHERE original_stock IS NULL;
```

**Note:** The `original_stock` column updates automatically when admin edits product stock.

## API Response Structure

### Product with Quota Info (During 6:30-7:00 AM)

```json
{
  "product_id": "P_001",
  "paper_type": "A4 Bond",
  "available_stock": 450,
  "original_stock": 500,
  "quota_phase": "personal_quota",
  "vendor_quota": 50,
  "vendor_purchased": 30,
  "vendor_remaining_quota": 20
}
```

### Product in Shared Pool (After 7:00 AM)

```json
{
  "product_id": "P_001",
  "paper_type": "A4 Bond",
  "available_stock": 350,
  "original_stock": 500,
  "quota_phase": "shared_pool",
  "vendor_quota": null,
  "vendor_purchased": null,
  "vendor_remaining_quota": null
}
```

**Note:** The quota phase is determined by **current time**, not when product was added. All products share the same quota windows (6:30-7:00, 14:00-14:30, 19:15-19:45).

## Frontend Display Examples

### Personal Quota Phase

```
Product A - A4 Bond Paper
Available: 450 units in stock
Your Quota: 20 / 50 units (30 purchased)

Personal Quota Phase (expires in 15 minutes)
[Buy Now] button
```

### Shared Pool Phase

```
Product A - A4 Bond Paper
Available: 350 units

Shared Pool - First Come First Served
[Buy Now] button
```

## Error Messages

### Quota Exceeded

```
"Quota limit exceeded. You can purchase up to 20 more units of this product during the personal quota phase."
```

### Stock Unavailable

```
"Not enough stock available."
```

## Important Notes

1. **Wild Products:** NOT affected - they remain first-come-first-served
2. **Quota Calculation:** Uses `Math.floor()` - always rounds DOWN (65.7 → 65)
3. **Approved Vendors Only:** Only vendors with `is_approved = TRUE` in login table count toward quota
4. **Time-Based:** Quota phase is determined by current time, not product release time
5. **All Products:** All products share the same quota windows (6:30-7:00, 14:00-14:30, 19:15-19:45)
6. **Admin Edits:** When admin updates product stock, `original_stock` is automatically updated

## Benefits

✅ **Fair Distribution:** Every vendor gets equal opportunity
✅ **No Rush:** Vendors have 30 minutes to decide, no need to race
✅ **Predictable:** Vendors know their quota in advance
✅ **Flexible:** After quota window, fastest vendors can still buy more
✅ **Simple Tracking:** All calculations done on-the-fly, no complex allocation tables

## Testing the System

### Test Scenario 1: Personal Quota Phase

1. Add product with 500 units at 6:30 AM
2. Have 10 active vendors
3. Each vendor should see quota of 50 units
4. Vendor A buys 30 units
5. Vendor A should now see 20 remaining quota
6. Vendor B should still see 50 quota (unaffected)
7. Try to buy 25 units as Vendor A → Should be rejected

### Test Scenario 2: Shared Pool Phase

1. Wait until 7:00 AM (quota window ends)
2. All vendors should see same total stock
3. No quota restrictions
4. Any vendor can buy any amount

### Test Scenario 3: Admin Stock Update

1. Update product stock from 100 to 500
2. System should automatically update `original_stock` to 500
3. New quota calculation uses the updated original_stock

## Troubleshooting

**Issue:** Vendors see 0 quota
- Check if `INDIVIDUAL_QUOTA_TIME_SLOTS` is set correctly in ENV
- Verify current time is within quota window (e.g., 6:30-7:00 AM)
- Verify there are approved vendors (`is_approved = TRUE` in login table)
- Ensure product has `original_stock` column set

**Issue:** Quota not updating after admin edits stock
- Verify `original_stock` column exists in product table
- Check logs for "Product updated" message
- Ensure admin update endpoint is working

**Issue:** Products not showing during quota hours
- Verify `PRODUCT_DISPLAY_TIME_SLOTS` includes quota slots
- Check IST time zone conversion
- Ensure quota slots are WITHIN display slots

**Issue:** Wrong quota phase detected
- Check current IST time vs quota slots
- Verify `INDIVIDUAL_QUOTA_TIME_SLOTS` ENV variable format
- Ensure backend has restarted after ENV changes

## Logs to Monitor

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
📦 Product P_001 updated: stock = 500, original_stock = 500
```


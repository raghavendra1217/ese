# Debug Quota System - Step by Step

## Issue: Products showing as "shared pool" instead of "personal quota"

### Step 1: Verify ENV Variable is Set

**In your terminal, run:**
```bash
cd backend
node -e "console.log('INDIVIDUAL_QUOTA_TIME_SLOTS:', process.env.INDIVIDUAL_QUOTA_TIME_SLOTS)"
```

**Expected output:**
```
INDIVIDUAL_QUOTA_TIME_SLOTS: 05:00-07:00,14:00-14:30,19:15-19:45
```

**If you see `undefined`:**
- ENV variable not loaded
- Check your `.env` file has the line: `INDIVIDUAL_QUOTA_TIME_SLOTS="05:00-07:00,14:00-14:30,19:15-19:45"`
- Restart the backend: `npm start`

---

### Step 2: Check Current IST Time

Your logs show: `5:12:00 am`

This **SHOULD be** in the quota phase (05:00-07:00 window).

**Check the logs when you load products page:**
Look for:
```
🔍 Quota Phase Check: {
  quotaSlotsFromEnv: '05:00-07:00,14:00-14:30,19:15-19:45',
  parsedQuotaSlots: [ ... ],
  currentTime: '05:12'
}
✅ Is in personal quota phase: true
```

**If you see:**
```
⚠️ No quota slots configured - defaulting to shared pool
```
→ ENV variable not being read

---

### Step 3: Check Database Has `original_stock` Column

**Run this SQL query:**
```sql
-- Check if column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'product' AND column_name = 'original_stock';
```

**Expected result:** One row showing the column exists

**If empty:** Column doesn't exist - run:
```sql
ALTER TABLE product ADD COLUMN original_stock BIGINT;
UPDATE product SET original_stock = available_stock WHERE original_stock IS NULL;
```

---

### Step 4: Check Products Have original_stock Set

**Run this SQL query:**
```sql
SELECT product_id, available_stock, original_stock 
FROM product 
WHERE stock_status != 'out_of_stock'
LIMIT 5;
```

**Check results:**
- If `original_stock` is `NULL` → Problem! Need to set it
- If `original_stock` has values → Good!

**If NULL, fix it:**
```sql
UPDATE product SET original_stock = available_stock WHERE original_stock IS NULL;
```

---

### Step 5: Check Approved Vendor Count

**Run this SQL query:**
```sql
SELECT COUNT(*) as approved_vendor_count
FROM vendors v
INNER JOIN login l ON v.id = l.user_id
WHERE l.is_approved = TRUE AND l.role = 'vendor';
```

**Expected:** At least 1 vendor

**If 0:** No approved vendors - quota system won't work
- Approve some vendors in admin panel

---

### Step 6: Watch Logs When Loading Products

**After restarting backend, load the products page and look for:**

```
🔍 Quota Phase Check: { ... }
✅ Is in personal quota phase: true
```

**Then further down:**
```
🕐 Time check - Current IST: 5:12:00 am, Checking 3 slots
🕐 Slot check - 05:00-07:00: Current 312min, Start 300, End 420, InSlot: true
```

**If you see `InSlot: false`:** Time detection issue

---

## Common Issues & Fixes

### Issue 1: ENV Not Loaded
**Symptom:** `quotaSlotsFromEnv: undefined` in logs

**Fix:**
1. Add to `backend/.env`: `INDIVIDUAL_QUOTA_TIME_SLOTS="05:00-07:00,14:00-14:30,19:15-19:45"`
2. Restart backend: Stop (Ctrl+C) and `npm start`
3. Verify with: `node -e "require('dotenv').config(); console.log(process.env.INDIVIDUAL_QUOTA_TIME_SLOTS)"`

---

### Issue 2: original_stock is NULL
**Symptom:** Products show, but no quota displayed

**Fix:**
```sql
-- Set original_stock for all products
UPDATE product SET original_stock = available_stock;
```

---

### Issue 3: No Approved Vendors
**Symptom:** Quota shows 0 or errors

**Fix:**
```sql
-- Check vendor approval status
SELECT v.id, v.vendor_name, l.is_approved, l.role
FROM vendors v
INNER JOIN login l ON v.id = l.user_id
LIMIT 10;

-- If is_approved is FALSE, approve vendors:
UPDATE login SET is_approved = TRUE WHERE role = 'vendor' AND user_id = 'v_XXX';
```

---

### Issue 4: Time Format Wrong
**Symptom:** Logs show quota phase = false at 5:12 AM (should be true)

**Check ENV format:**
```bash
# Correct format (24-hour time, HH:MM-HH:MM):
INDIVIDUAL_QUOTA_TIME_SLOTS="05:00-07:00,14:00-14:30,19:15-19:45"

# Wrong format (missing leading zeros):
INDIVIDUAL_QUOTA_TIME_SLOTS="5:00-7:00,14:00-14:30,19:15-19:45"  ❌
```

---

## Quick Test Commands

**1. Test ENV is loaded:**
```bash
cd backend
node -e "require('dotenv').config(); console.log('Quota Slots:', process.env.INDIVIDUAL_QUOTA_TIME_SLOTS)"
```

**2. Test database column exists:**
```bash
psql -U your_user -d your_database -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'product' AND column_name = 'original_stock';"
```

**3. Test vendor count:**
```bash
psql -U your_user -d your_database -c "SELECT COUNT(*) FROM vendors v INNER JOIN login l ON v.id = l.user_id WHERE l.is_approved = TRUE AND l.role = 'vendor';"
```

---

## After Fixes - Restart Backend

```bash
cd backend
# Stop current server (Ctrl+C)
npm start
```

Then load products page and check logs for quota phase detection!

---

## Expected Working Logs

When everything works, you should see:

```
🔍 Quota Phase Check: {
  quotaSlotsFromEnv: '05:00-07:00,14:00-14:30,19:15-19:45',
  parsedQuotaSlots: [
    { start: '05:00', end: '07:00' },
    { start: '14:00', end: '14:30' },
    { start: '19:15', end: '19:45' }
  ],
  currentTime: '05:12'
}
🕐 Time check - Current IST: 5:12:00 am, Checking 3 slots
🕐 Slot check - 05:00-07:00: Current 312min, Start 300, End 420, InSlot: true
✅ Is in personal quota phase: true
```

And products should show:
```json
{
  "quota_phase": "personal_quota",
  "vendor_quota": 50,
  "vendor_purchased": 0,
  "vendor_remaining_quota": 50
}
```


# Quick Start - Product Quota System

## 🎯 What Was Built

A **fair quota system** for regular products where:
- **Personal Quota Phase (30 min):** Each vendor gets equal share (e.g., 50 units each)
- **Shared Pool Phase (after 30 min):** First-come-first-served
- **Wild Products:** Unaffected, remain first-come-first-served

## 🚀 Setup (3 Steps)

### Step 1: Add Database Column

Add `original_stock` column to your product table:

```sql
ALTER TABLE product ADD COLUMN original_stock BIGINT;
UPDATE product SET original_stock = available_stock WHERE original_stock IS NULL;
```

### Step 2: Add ENV Variable

Add to your `backend/.env` file:

```bash
INDIVIDUAL_QUOTA_TIME_SLOTS="06:30-07:00,14:00-14:30,19:15-19:45"
```

### Step 3: Restart Backend

```bash
cd backend
npm run dev
```

Done! ✅

## 📋 How It Works

### Example: 500 Units with 10 Vendors

**At 6:30 AM (Quota Phase Starts):**
```
Each vendor quota: floor(500/10) = 50 units

Vendor A: sees 50 units available
Vendor B: sees 50 units available
...
Vendor J: sees 50 units available
```

**Vendor A buys 30 units:**
```
Vendor A: now sees 20 units remaining (50-30=20)
Vendor B: still sees 50 units ← Not affected!
```

**Vendor A tries to buy 25 units:**
```
❌ REJECTED: "Quota limit exceeded. You can purchase up to 20 more units"
```

**At 7:00 AM (Shared Pool Starts):**
```
All vendors see: 420 units available
No quota limits
First-come-first-served
```

## 📊 What Changed in the Code

### Database
- **Manual:** Add `original_stock` BIGINT column to `product` table

### Backend
- **timeUtils.js:** Added time-based quota phase detection (checks current time)
- **productController.js:** Returns quota info with each product, updates `original_stock` on stock edits
- **tradingController.js:** Validates quota limits on purchase during personal phase

### Files Created
- `PRODUCT_QUOTA_SYSTEM.md` - Full documentation
- `QUOTA_ENV_CONFIGURATION.txt` - ENV setup guide
- `QUOTA_IMPLEMENTATION_SUMMARY.md` - Implementation details
- `QUICK_START_QUOTA_SYSTEM.md` - This file

## 🧪 Quick Test

1. **Add product at 6:30 AM with 500 units**
2. **Check vendor sees quota of 50** (assuming 10 active vendors)
3. **Buy 30 units as Vendor A**
4. **Verify Vendor A sees 20 remaining**
5. **Try buying 25 as Vendor A** → Should reject
6. **Wait until 7:00 AM** → No quota limits

## 🔧 Configuration Options

**Default (30-min windows):**
```bash
INDIVIDUAL_QUOTA_TIME_SLOTS="06:30-07:00,14:00-14:30,19:15-19:45"
```

**Shorter (15-min windows):**
```bash
INDIVIDUAL_QUOTA_TIME_SLOTS="06:30-06:45,14:00-14:15,19:15-19:30"
```

**Longer (1-hour windows):**
```bash
INDIVIDUAL_QUOTA_TIME_SLOTS="06:30-07:30,14:00-15:00,19:15-20:15"
```

**Disable quota system:**
```bash
INDIVIDUAL_QUOTA_TIME_SLOTS=""
```

## 📱 Frontend Integration

Products now return this data:

```javascript
{
  product_id: "P_001",
  available_stock: 450,
  quota_phase: "personal_quota",  // or "shared_pool"
  vendor_quota: 50,               // total quota
  vendor_purchased: 30,           // already bought
  vendor_remaining_quota: 20      // can still buy
}
```

Display to user:
```
Your Quota: 20 / 50 units (30 purchased)
⏱️ Personal Quota Phase
```

or

```
Available: 450 units
🌐 Shared Pool - First Come First Served
```

## ⚠️ Important Notes

1. **Wild Products NOT affected** - they stay first-come-first-served
2. **Math.floor used** - 65.7 rounds DOWN to 65
3. **All vendors counted** - all registered vendors included in quota calculation
4. **Time-based quota** - quota phase determined by current time, not product release
5. **All products share quota windows** - 6:30-7:00, 14:00-14:30, 19:15-19:45
6. **Admin edits update original_stock** - automatically resets quota calculation
7. **Quota slots must be within display slots** - otherwise won't work

## 📞 Support

Check these files for details:
- **Complete docs:** `PRODUCT_QUOTA_SYSTEM.md`
- **ENV setup:** `QUOTA_ENV_CONFIGURATION.txt`
- **Implementation:** `QUOTA_IMPLEMENTATION_SUMMARY.md`

Watch logs for:
```
🔒 Personal quota phase active for product: P_001
📊 Quota check: { ... }
📦 Product P_001 updated: stock = 500, original_stock = 500
```

---

**You're all set! The quota system is ready to use.** 🎉


# Investment Plan Logic - Complete Documentation

## Overview
This document contains all investment plans available in the system and their calculation logic.

---

## Regular Plans (Equal Disbursements)

### 1. 5k - 32 days
- **Investment:** ₹5,000
- **Profit:** ₹1,000 (20%)
- **Total Return:** ₹6,000
- **Duration:** 32 days
- **Interval:** Every 8 days
- **Disbursements:** 4 payments of ₹1,500 each
- **Principle/Profit Split:** N/A (total only)

### 2. 10k - 30 days
- **Investment:** ₹10,000
- **Profit:** ₹1,500 (15%)
- **Total Return:** ₹11,500
- **Duration:** 30 days
- **Interval:** Every 15 days
- **Disbursements:** 2 payments of ₹5,750 each
- **Principle/Profit Split:** Principle 83.33%, Profit 16.67%

### 3. 50k - 60 days
- **Investment:** ₹50,000
- **Profit:** ₹10,000 (20%)
- **Total Return:** ₹60,000
- **Duration:** 60 days
- **Interval:** Every 15 days
- **Disbursements:** 4 payments of ₹15,000 each
- **Principle/Profit Split:** Principle 83.33%, Profit 16.67%

### 4. 1 lakh - 60 days
- **Investment:** ₹1,00,000
- **Profit:** ₹20,000 (20%)
- **Total Return:** ₹1,20,000
- **Duration:** 60 days
- **Interval:** Every 15 days
- **Disbursements:** 4 payments of ₹30,000 each
- **Principle/Profit Split:** Principle 83.33%, Profit 16.67%

### 5. 50k - 120 days
- **Investment:** ₹50,000
- **Profit:** ₹18,000 (36%)
- **Total Return:** ₹68,000
- **Duration:** 120 days
- **Interval:** Every 15 days
- **Disbursements:** 8 payments of ₹8,500 each
- **Principle/Profit Split:** Principle 83.33%, Profit 16.67%

### 6. 1 lakh - 120 days
- **Investment:** ₹1,00,000
- **Profit:** ₹38,000 (38%)
- **Total Return:** ₹1,38,000
- **Duration:** 120 days
- **Interval:** Every 15 days
- **Disbursements:** 8 payments of ₹17,250 each
- **Principle/Profit Split:** Principle 83.33%, Profit 16.67%

---

## Special Plans (Principle Returned at End)

These plans pay profit regularly, then return the full principle on the final day.

### 7. 10k - 90 days (Special Plan)
- **Investment:** ₹10,000
- **Profit:** ₹4,500 (45%)
- **Total Return:** ₹14,500
- **Duration:** 90 days
- **Interval:** Every 30 days
- **Disbursements:**
  - First 3 payments: ₹1,500 each (profit only)
  - Final payment (Day 91): ₹10,000 (principle)
- **Display Format:** Only shows "Milk Profit" column (no principle/profit split)

### 8. 50k - 180 days (Special Plan)
- **Investment:** ₹50,000
- **Profit:** ₹30,000 (60%)
- **Total Return:** ₹80,000
- **Duration:** 180 days
- **Interval:** Every 15 days
- **Disbursements:**
  - First 12 payments: ₹2,500 each (profit only)
  - Final payment (Day 181): ₹50,000 (principle)
- **Display Format:** Only shows "Milk Profit" column

### 9. 1 lakh - 180 days (Special Plan)
- **Investment:** ₹1,00,000
- **Profit:** ₹60,000 (60%)
- **Total Return:** ₹1,60,000
- **Duration:** 180 days
- **Interval:** Every 15 days
- **Disbursements:**
  - First 12 payments: ₹5,000 each (profit only)
  - Final payment (Day 181): ₹1,00,000 (principle)
- **Display Format:** Only shows "Milk Profit" column

### 10. 50k - 240 days (Special Plan)
- **Investment:** ₹50,000
- **Profit:** ₹40,000 (80%)
- **Total Return:** ₹90,000
- **Duration:** 240 days
- **Interval:** Every 15 days
- **Disbursements:**
  - First 16 payments: ₹2,500 each (profit only)
  - Final payment (Day 241): ₹50,000 (principle)
- **Display Format:** Only shows "Milk Profit" column

### 11. 1 lakh - 240 days (Special Plan)
- **Investment:** ₹1,00,000
- **Profit:** ₹80,000 (80%)
- **Total Return:** ₹1,80,000
- **Duration:** 240 days
- **Interval:** Every 15 days
- **Disbursements:**
  - First 16 payments: ₹5,000 each (profit only)
  - Final payment (Day 241): ₹1,00,000 (principle)
- **Display Format:** Only shows "Milk Profit" column

### 12. 5 lakh - 240 days (Special Plan)
- **Investment:** ₹5,00,000
- **Profit:** ₹4,00,000 (80%)
- **Total Return:** ₹9,00,000
- **Duration:** 240 days
- **Interval:** Every 15 days
- **Disbursements:**
  - First 16 payments: ₹25,000 each (profit only)
  - Final payment (Day 241): ₹5,00,000 (principle)
- **Display Format:** Only shows "Milk Profit" column

### 13. 5 lakh - 360 days (Special Plan)
- **Investment:** ₹5,00,000
- **Profit:** ₹6,00,000 (120%)
- **Total Return:** ₹11,00,000
- **Duration:** 360 days
- **Interval:** Every 15 days
- **Disbursements:**
  - First 24 payments: ₹25,000 each (profit only)
  - Final payment (Day 361): ₹5,00,000 (principle)
- **Display Format:** Only shows "Milk Profit" column

### 14. 10 lakh - 180 days (Special Plan)
- **Investment:** ₹10,00,000
- **Profit:** ₹6,00,000 (60%)
- **Total Return:** ₹16,00,000
- **Duration:** 180 days
- **Interval:** Every 15 days
- **Disbursements:**
  - First 12 payments: ₹50,000 each (profit only)
  - Final payment (Day 181): ₹10,00,000 (principle)
- **Display Format:** Only shows "Milk Profit" column

### 15. 10 lakh - 360 days (Special Plan)
- **Investment:** ₹10,00,000
- **Profit:** ₹12,00,000 (120%)
- **Total Return:** ₹22,00,000
- **Duration:** 360 days
- **Interval:** Every 15 days
- **Disbursements:**
  - First 24 payments: ₹50,000 each (profit only)
  - Final payment (Day 361): ₹10,00,000 (principle)
- **Display Format:** Only shows "Milk Profit" column

---

## Key Logic Rules

### 1. Principle/Profit Split Calculation
For regular plans (excluding special plans), each disbursement is split:
- **Principle Amount:** 5/6 of total (83.333%)
- **Profit Amount:** 1/6 of total (16.667%)

### 2. Special Plan Display
Special plans show only one column in reports:
- Column: "Milk Profit" (profit disbursement)
- The final principle return is NOT shown in the report
- Added note: "The principal amount will be disbursed only upon the user's request"

### 3. Date Calculation
- Start date: Investment Date
- Each disbursement: Start Date + (Interval × Week Number)
- Example: 15-day interval, Start = Jan 1
  - Week 1: Jan 16 (15 days later)
  - Week 2: Jan 31 (30 days later)
  - Week 3: Feb 15 (45 days later)

### 4. Principle Return Logic
In special plans:
- Principle is returned on day AFTER plan duration
- Example: 180-day plan = Principle on Day 181
- Principle return is triggered by user request, not automatic

---

## Implementation Details

### Files Involved:
1. **`backend/api/utils/disbursementCalculator.js`** - Core logic
2. **`backend/api/controllers/htmlController.js`** - HTML report generation
3. **`backend/api/controllers/investorController.js`** - Investor CRUD operations
4. **`frontend/src/pages/admin/InvestorManagementPage.jsx`** - Frontend display logic

### Plan Configuration Structure:
```javascript
'plan_type': {
    'select_plan': {
        investment: number,
        profit: number,
        totalReturn: number,
        durationDays: number,
        intervalDays: number,
        numDisbursements: number,
        specialPlan: boolean  // true for special plans
    }
}
```

### Database Tables:
- **`investordetails`** - Stores investor information
- **`disbursement_schedules`** - Stores schedule metadata
- **`disbursement_detail`** - Stores individual disbursement records

---

## Notes for Special Plans

Special plan notes added to HTML reports:
- Note 5: Principal amount will be disbursed only upon user request
- Note 6: Principal amount will be released within one working day of request, provided minimum duration has elapsed

These notes are automatically added based on plan combination.

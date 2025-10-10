# Quick Start: Product Visibility in Admin Dashboard

## What You'll See

### New Column in Vendor Table
A new "Product Access" column has been added between "Joined" and "Actions" columns.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Vendor Table - Admin Dashboard                                          │
├──────────┬──────┬────────────┬────────┬───────────┬────────┬────────────┤
│ Vendor   │ ID   │ Coord.     │ Status │ Wallet    │ Joined │ Prod Access│
├──────────┼──────┼────────────┼────────┼───────────┼────────┼────────────┤
│ John Doe │ 001  │ Coord A    │ Active │ ₹10,000   │ 1/1/25 │    [ON]    │ ← Green switch
│ Jane S.  │ 002  │ Coord B    │ Active │ ₹5,000    │ 2/1/25 │    [OFF]   │ ← Gray switch
│ Bob M.   │ 003  │ None       │ Pending│ ₹0        │ 3/1/25 │    [ON]    │ ← Green switch
└──────────┴──────┴────────────┴────────┴───────────┴────────┴────────────┘
```

## How to Use

### Enable Product Access
1. Find the vendor in the table
2. Look at "Product Access" column
3. Click the switch (it will turn GREEN)
4. Done! Vendor can now see products

### Disable Product Access
1. Find the vendor in the table
2. Look at "Product Access" column
3. Click the switch (it will turn GRAY)
4. Done! Vendor cannot see products anymore

## Visual Guide

### Switch States

**ENABLED (Green Switch)** 🟢
```
[⚫────]  →  Vendor CAN see products
```

**DISABLED (Gray Switch)** ⚪
```
[────⚫]  →  Vendor CANNOT see products
```

### What Happens When You Toggle

**Before:**
```
Vendor: John Doe
Product Access: [OFF] (Gray)
Status: Cannot see any products
```

**Click the switch...**

**After:**
```
Vendor: John Doe  
Product Access: [ON] (Green)
Status: Can see and purchase products
```

## Instant Feedback

After clicking the switch, you'll see:
1. Switch changes color immediately
2. Alert box appears: "Product visibility has been enabled/disabled for vendor [Name]"
3. Change is saved automatically
4. No page refresh needed

## Mobile View

On mobile devices, the switch appears in each vendor card:

```
┌─────────────────────────────────┐
│ 👤 John Doe                     │
│    ID: vendor_001               │
│    Coordinator: Coord A         │
│    Wallet: ₹10,000             │
│─────────────────────────────────│
│ Product Access:  Enabled  [ON]  │ ← Tap to toggle
└─────────────────────────────────┘
```

## Common Actions

### Scenario 1: Vendor Has Payment Issue
```
Problem: Vendor owes money
Action:  Click switch to disable
Result:  Vendor cannot make new purchases
```

### Scenario 2: Issue Resolved
```
Problem: Vendor paid what they owed
Action:  Click switch to enable
Result:  Vendor can purchase again
```

### Scenario 3: New Vendor Verification
```
Problem: New vendor needs approval
Action:  Keep switch disabled until verified
Result:  Only verified vendors can purchase
```

## Tips

1. **Hover Over Switch**: Tooltip shows current status
2. **Green = Good**: Vendor has normal access
3. **Gray = Restricted**: Vendor cannot see products
4. **Instant Effect**: Change applies immediately
5. **No Confirmation**: One click is all you need

## What Vendors See

### When Access is ENABLED
- Normal product list
- Can view prices
- Can add to cart
- Can make purchases

### When Access is DISABLED
- Empty product list
- Message: "Product access has been temporarily disabled for your account. Please contact support."
- Cannot make purchases
- Cannot see product prices

## FAQ

**Q: Will this affect vendors who already have products in cart?**
A: No, but they cannot proceed with new purchases.

**Q: Can I re-enable access anytime?**
A: Yes, just click the switch again.

**Q: Do I need to refresh the page?**
A: No, changes apply instantly.

**Q: Will vendors be notified?**
A: Not automatically. You should communicate with them separately.

**Q: Can I see who has disabled access?**
A: Yes, look for gray switches in the table.

**Q: Is there a bulk toggle option?**
A: Not yet, but you can toggle each vendor individually.

## Keyboard Navigation

- **Tab**: Navigate between switches
- **Space/Enter**: Toggle current switch
- **Click**: Direct toggle

## Troubleshooting

**Switch not responding?**
- Check your internet connection
- Refresh the page
- Ensure you're logged in as admin/coordinator

**Change not saving?**
- Check browser console for errors
- Verify you have admin permissions
- Contact IT support if issue persists

## Security

- Only admins and coordinators can toggle
- All changes are logged
- Requires valid authentication
- Changes are tracked by timestamp

## Quick Reference

| Switch Color | Status   | Vendor Can See Products |
|-------------|----------|------------------------|
| 🟢 Green    | Enabled  | YES                    |
| ⚪ Gray     | Disabled | NO                     |

---

**Need Help?**
- Check `ADMIN_UI_PRODUCT_VISIBILITY.md` for detailed documentation
- Check `FINAL_IMPLEMENTATION_SUMMARY.md` for complete overview
- Contact technical support for issues

**Access the Feature:**
Admin Dashboard → Vendor Management → All Vendors Table → Product Access Column


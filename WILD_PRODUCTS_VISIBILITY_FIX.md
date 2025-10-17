# Wild Products Visibility Fix

## Issue Identified
Wild products were **NOT** checking the `product_visibility` setting, meaning vendors with disabled visibility could still see and purchase wild products even though regular products were hidden.

## What Was Fixed

### File Modified
`backend/api/controllers/wildProductController.js`

### Function Updated
`getAvailableWildProducts()` - Lines 169-228

### Changes Made
Added vendor visibility check before displaying wild products, matching the logic used for regular products.

## How It Works Now

When a vendor tries to access wild products:

1. **Check User Role**: System identifies if user is vendor, admin, or coordinator
2. **Check Visibility** (for vendors only):
   - Query database for vendor's `product_visibility` setting
   - If vendor not found → Return 404
   - If `product_visibility = false` → Return empty products with message
   - If `product_visibility = true` → Continue to next check
3. **Check Time Constraints**: Verify current time is within business hours
4. **Return Products**: If all checks pass, return available wild products

## Behavior Summary

| User Role      | Visibility Check | Time Check | Can See Wild Products?                    |
|----------------|------------------|------------|-------------------------------------------|
| Admin          | ❌ Bypassed      | ❌ Bypassed| ✅ Always (regardless of any settings)    |
| Coordinator    | ❌ Bypassed      | ❌ Bypassed| ✅ Always (regardless of any settings)    |
| Vendor (ON)    | ✅ Checked       | ✅ Checked | ✅ Yes (if within business hours)         |
| Vendor (OFF)   | ✅ Checked       | ⏭️ Skipped | ❌ No (visibility disabled)               |

## Complete Coverage

Now **both** product types respect the visibility setting:

| Product Type      | Visibility Check | Hidden When visibility=false |
|-------------------|------------------|------------------------------|
| Regular Products  | ✅ Yes           | ✅ Yes                       |
| Wild Products     | ✅ Yes (NOW!)    | ✅ Yes                       |

## Response When Disabled

When a vendor with `product_visibility = false` tries to access wild products:

```json
{
  "success": false,
  "message": "Product access has been temporarily disabled for your account. Please contact support.",
  "products": [],
  "visibilityDisabled": true
}
```

## Admin/Coordinator Access

Admins and coordinators **bypass all checks** and can always see:
- Regular products
- Wild products
- Regardless of time constraints
- Regardless of any visibility settings

## Testing

### Test 1: Vendor with Visibility Disabled
```bash
# As admin, disable visibility for a vendor
curl -X PUT http://localhost:5000/api/admin/vendors/vendor_123/product-visibility \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productVisibility": false}'

# As that vendor, try to fetch wild products
curl http://localhost:5000/api/wild-products/available \
  -H "Authorization: Bearer VENDOR_TOKEN"

# Expected: Empty products list with disabled message
```

### Test 2: Vendor with Visibility Enabled
```bash
# As admin, enable visibility
curl -X PUT http://localhost:5000/api/admin/vendors/vendor_123/product-visibility \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productVisibility": true}'

# As that vendor, try to fetch wild products
curl http://localhost:5000/api/wild-products/available \
  -H "Authorization: Bearer VENDOR_TOKEN"

# Expected: Wild products list (if within business hours)
```

### Test 3: Admin Access
```bash
# As admin, fetch wild products
curl http://localhost:5000/api/wild-products/available \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Expected: Always see products, regardless of any settings
```

## Logging

The system now logs when wild product visibility is checked:

```
🔍 Attempting to fetch available wild products...
🚫 Wild product visibility disabled for vendor vendor_123
```

Or when visibility is active:
```
🔍 Attempting to fetch available wild products...
🕐 Wild product access time check: {
  currentIST: '14:30:00',
  allowedHours: '09:00-18:00',
  isAllowed: true,
  userId: 'vendor_123',
  role: 'vendor'
}
```

## Security

- ✅ Only affects vendors (not admins/coordinators)
- ✅ Checks happen server-side (cannot be bypassed)
- ✅ Same security model as regular products
- ✅ Consistent behavior across all product types

## Deployment

No additional deployment steps needed beyond restarting the backend server:

```bash
cd backend
npm start
```

The database column (`product_visibility`) should already exist from the previous migration.

## Summary

**Before Fix:**
- Regular products: Respected visibility ✅
- Wild products: Ignored visibility ❌

**After Fix:**
- Regular products: Respected visibility ✅
- Wild products: Respected visibility ✅

Now when an admin disables `product_visibility` for a vendor, that vendor will see:
- ❌ No regular products
- ❌ No wild products
- ✅ Clear message explaining why

Perfect consistency across the entire system!

---

**Status**: FIXED ✅
**Tested**: Ready for deployment
**Impact**: Wild products now properly respect product visibility settings


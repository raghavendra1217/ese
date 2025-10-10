# Stealth Mode Product Visibility

## Overview
When a vendor's `product_visibility` is set to `FALSE`, they won't be told their access is disabled. Instead, they'll simply see "No products available" - making it appear as if the store is just out of stock.

## Philosophy
**Stealth Restriction**: The vendor doesn't know they've been specifically blocked. It just looks like there's no inventory available at the moment.

## What Vendors See

### When `product_visibility = false`:

#### Regular Products Page
```
📦 Products Available: 0
Message: "No products available at the moment."
```

#### Wild Products Page
```
📦 Wild Products Available: 0
Message: "No products available at the moment."
```

#### Product Count API
```json
{
  "availableProducts": 0,
  "message": "No products currently in stock."
}
```

### Vendor's Perspective
From the vendor's point of view, it looks like:
- "Oh, they must be out of stock right now"
- "I'll check back later"
- No indication they've been restricted

## Admin Logging (Backend Only)

While the vendor sees "no stock", admins can see in the server logs:
```
🚫 Product visibility disabled for vendor vendor_123
```

This helps admins track what's happening without alerting the vendor.

## Comparison

| Status                        | What Vendor Sees                                                     |
|-------------------------------|----------------------------------------------------------------------|
| **Before (OLD)**              | "Product access has been temporarily disabled for your account. Please contact support." |
| **After (NEW - Stealth)**     | "No products available at the moment."                              |

## Benefits

### 1. No Confrontation
- Vendor doesn't feel singled out
- No immediate conflict
- Avoids defensive reactions

### 2. Cleaner UX
- Looks like a normal "out of stock" scenario
- Vendor doesn't panic
- Reduces support tickets

### 3. Time to Resolve Issues
- Admin can investigate quietly
- Vendor isn't immediately aware
- Less pressure on resolution

### 4. Professional Appearance
- Maintains business relationship
- Vendor doesn't feel "punished"
- System appears to have stock issues, not access issues

## Use Cases

### Use Case 1: Payment Investigation
**Scenario**: Suspicious payment activity detected
**Action**: Admin disables visibility
**Vendor Sees**: "No products available"
**Result**: Investigation proceeds without alerting vendor

### Use Case 2: Debt Collection
**Scenario**: Vendor owes money for previous orders
**Action**: Admin disables visibility until payment
**Vendor Sees**: "No stock available"
**Result**: Natural pressure to resolve payment

### Use Case 3: Terms Violation Review
**Scenario**: Possible ToS violation under review
**Action**: Temporarily disable visibility
**Vendor Sees**: "No products"
**Result**: Pause in activity while admin reviews

## Implementation Details

### Regular Products
**File**: `backend/api/controllers/productController.js`

**Response when disabled**:
```javascript
{
    success: true,
    message: 'No products available at the moment.',
    products: [],
    timeInfo: {
        currentTime: '14:30:00',
        timezone: 'IST (UTC+05:30)'
    }
}
```

### Wild Products
**File**: `backend/api/controllers/wildProductController.js`

**Response when disabled**:
```javascript
{
    success: true,
    message: 'No products available at the moment.',
    products: [],
    timeInfo: {
        currentTime: '14:30:00',
        timezone: 'IST (UTC+05:30)'
    }
}
```

### Product Count
**Response when disabled**:
```javascript
{
    availableProducts: 0,
    message: 'No products currently in stock.'
}
```

## Frontend Behavior

Since `success: true` is returned, the frontend will:
- Show empty product list
- Display "No products available at the moment"
- Show 0 in product count
- No error alerts
- No special warnings

**It looks exactly like being out of stock.**

## Admin Side

### What Admin Sees
In the Product Visibility management page:
- Clear toggle showing vendor is disabled
- Statistics showing how many vendors have access disabled
- Full control to re-enable

### Server Logs
```
🚫 Product visibility disabled for vendor vendor_123
🚫 Wild product visibility disabled for vendor vendor_123
```

### No Vendor Notification
- Vendor receives NO email
- Vendor receives NO alert
- Vendor sees NO warning message
- Just appears as no stock

## Testing

### Test Stealth Mode
1. **As Admin**: Disable visibility for test vendor
2. **As That Vendor**: 
   - Go to products page → See "No products available"
   - Go to wild products page → See "No products available"
   - Check dashboard → See 0 available products
   - No error messages, no alerts
   - Looks like normal out of stock situation

3. **As Admin**: Re-enable visibility
4. **As Vendor**: Products appear again

## Security

- ✅ Vendor cannot detect they're restricted
- ✅ No API response indicates restriction
- ✅ Appears as normal system behavior
- ✅ Admin logs track the real reason
- ✅ Only admins know the truth

## Communication Strategy

### When to Tell Vendor
If you want to inform the vendor about restrictions:
- Send email separately
- Call them directly
- Use admin messaging system
- Handle offline

### When to Keep Silent
Use stealth mode when:
- Investigation in progress
- Gathering evidence
- Temporary measure
- Avoiding escalation

## Advantages Over Direct Messaging

| Direct Message Approach                      | Stealth Mode Approach                     |
|---------------------------------------------|-------------------------------------------|
| "Your access is disabled"                   | "No products available"                   |
| Vendor knows they're restricted             | Vendor thinks it's stock issue            |
| May cause panic/conflict                    | No immediate reaction                     |
| Vendor may contact support immediately      | Vendor waits patiently                    |
| Requires immediate explanation              | Gives admin time to investigate           |
| Can damage relationship                     | Maintains normal business relationship    |

## Best Practices

1. **Use for Temporary Issues**: Best for short-term restrictions
2. **Document Internally**: Keep admin notes on why visibility was disabled
3. **Monitor Vendor Reaction**: See if vendor contacts support
4. **Re-enable Promptly**: Once issue resolved, restore access quickly
5. **Consider Communication**: Decide if/when to inform vendor

## Summary

**Stealth Mode = Professional, Non-Confrontational Access Control**

When you disable a vendor's product visibility:
- ✅ They see "No products available" (looks like out of stock)
- ✅ No special error messages
- ✅ No indication they're restricted
- ✅ System appears to have low inventory
- ✅ Admin logs show the real reason
- ✅ Can be re-enabled anytime

Perfect for handling sensitive situations professionally!

---

**Status**: IMPLEMENTED ✅
**Mode**: Stealth Restriction Active
**Vendor Impact**: Appears as normal out-of-stock scenario


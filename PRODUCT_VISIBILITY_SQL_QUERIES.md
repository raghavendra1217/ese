# Product Visibility - SQL Quick Reference

## Useful SQL Queries for Managing Product Visibility

### 1. Check Current Visibility Status

```sql
-- View all vendors with their visibility status
SELECT 
    id, 
    vendor_name, 
    email, 
    product_visibility,
    created_at,
    updated_at
FROM vendors
ORDER BY created_at DESC;
```

### 2. Find Vendors with Disabled Visibility

```sql
-- List all vendors who can't see products
SELECT 
    v.id, 
    v.vendor_name, 
    v.email, 
    v.product_visibility,
    l.is_approved,
    l.status
FROM vendors v
JOIN login l ON v.id = l.user_id
WHERE v.product_visibility = FALSE
ORDER BY v.updated_at DESC;
```

### 3. Manually Enable/Disable Visibility

```sql
-- Disable product visibility for a specific vendor
UPDATE vendors 
SET product_visibility = FALSE, updated_at = NOW()
WHERE id = 'vendor_123';

-- Enable product visibility for a specific vendor
UPDATE vendors 
SET product_visibility = TRUE, updated_at = NOW()
WHERE id = 'vendor_123';
```

### 4. Bulk Operations

```sql
-- Disable visibility for multiple vendors at once
UPDATE vendors 
SET product_visibility = FALSE, updated_at = NOW()
WHERE id IN ('vendor_001', 'vendor_002', 'vendor_003');

-- Enable visibility for all approved vendors
UPDATE vendors v
SET product_visibility = TRUE, updated_at = NOW()
FROM login l
WHERE v.id = l.user_id 
AND l.is_approved = TRUE;
```

### 5. Count Vendors by Visibility Status

```sql
-- Count how many vendors have visibility enabled/disabled
SELECT 
    product_visibility,
    COUNT(*) as vendor_count
FROM vendors
GROUP BY product_visibility;
```

### 6. Find Recently Changed Visibility

```sql
-- Vendors whose visibility was changed in the last 7 days
SELECT 
    id, 
    vendor_name, 
    email, 
    product_visibility,
    updated_at
FROM vendors
WHERE updated_at >= NOW() - INTERVAL '7 days'
AND updated_at IS NOT NULL
ORDER BY updated_at DESC;
```

### 7. Vendors with Visibility Issues

```sql
-- Find approved vendors with disabled visibility (might need attention)
SELECT 
    v.id, 
    v.vendor_name, 
    v.email, 
    v.product_visibility,
    l.is_approved,
    l.status,
    v.updated_at
FROM vendors v
JOIN login l ON v.id = l.user_id
WHERE l.is_approved = TRUE 
AND v.product_visibility = FALSE
ORDER BY v.updated_at DESC;
```

### 8. Comprehensive Vendor Status Report

```sql
-- Detailed report of vendor status including visibility
SELECT 
    v.id, 
    v.vendor_name, 
    v.email,
    v.phone_number,
    l.is_approved as login_approved,
    l.status as login_status,
    v.product_visibility,
    w.digital_money as wallet_balance,
    COUNT(t.trade_id) as total_purchases,
    v.created_at,
    v.updated_at
FROM vendors v
LEFT JOIN login l ON v.id = l.user_id
LEFT JOIN wallet w ON v.id = w.id
LEFT JOIN trading t ON v.id = t.vendor_id AND t.is_approved = 'approved'
GROUP BY v.id, v.vendor_name, v.email, v.phone_number, 
         l.is_approved, l.status, v.product_visibility, 
         w.digital_money, v.created_at, v.updated_at
ORDER BY v.created_at DESC;
```

### 9. Reset All to Default (Enable for All)

```sql
-- WARNING: This enables product visibility for ALL vendors
UPDATE vendors 
SET product_visibility = TRUE, updated_at = NOW();
```

### 10. Conditional Visibility Update

```sql
-- Disable visibility for vendors with no purchases
UPDATE vendors v
SET product_visibility = FALSE, updated_at = NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM trading t 
    WHERE t.vendor_id = v.id 
    AND t.is_approved = 'approved'
);

-- Enable visibility for vendors with at least 5 approved purchases
UPDATE vendors v
SET product_visibility = TRUE, updated_at = NOW()
WHERE (
    SELECT COUNT(*) FROM trading t 
    WHERE t.vendor_id = v.id 
    AND t.is_approved = 'approved'
) >= 5;
```

### 11. Check Specific Vendor

```sql
-- Detailed check for a specific vendor
SELECT 
    v.id, 
    v.vendor_name, 
    v.email, 
    v.product_visibility,
    l.is_approved,
    l.status,
    l.role,
    w.digital_money,
    v.created_at,
    v.updated_at as last_modified
FROM vendors v
LEFT JOIN login l ON v.id = l.user_id
LEFT JOIN wallet w ON v.id = w.id
WHERE v.id = 'vendor_123';
```

### 12. Audit Query - Track Changes

```sql
-- If you want to implement change tracking, you could create a history table
CREATE TABLE IF NOT EXISTS vendor_visibility_history (
    id SERIAL PRIMARY KEY,
    vendor_id VARCHAR NOT NULL,
    changed_by VARCHAR NOT NULL,
    old_value BOOLEAN,
    new_value BOOLEAN,
    reason TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert into history when making changes
INSERT INTO vendor_visibility_history (vendor_id, changed_by, old_value, new_value, reason)
SELECT 'vendor_123', 'admin_001', product_visibility, FALSE, 'Payment issues'
FROM vendors WHERE id = 'vendor_123';

UPDATE vendors 
SET product_visibility = FALSE, updated_at = NOW()
WHERE id = 'vendor_123';
```

## Common Scenarios

### Scenario 1: Vendor Has Payment Issue
```sql
-- Step 1: Disable their product access
UPDATE vendors 
SET product_visibility = FALSE, updated_at = NOW()
WHERE id = 'vendor_with_issue';

-- Step 2: Verify the change
SELECT id, vendor_name, email, product_visibility 
FROM vendors 
WHERE id = 'vendor_with_issue';
```

### Scenario 2: Issue Resolved, Re-enable Access
```sql
-- Re-enable product access
UPDATE vendors 
SET product_visibility = TRUE, updated_at = NOW()
WHERE id = 'vendor_with_issue';

-- Confirm the change
SELECT id, vendor_name, email, product_visibility, updated_at 
FROM vendors 
WHERE id = 'vendor_with_issue';
```

### Scenario 3: Emergency - Disable All Vendor Access
```sql
-- EMERGENCY: Disable product access for all vendors (except keep admins unaffected)
UPDATE vendors v
SET product_visibility = FALSE, updated_at = NOW()
FROM login l
WHERE v.id = l.user_id 
AND l.role = 'vendor';
```

### Scenario 4: Restore After Emergency
```sql
-- Restore access for all approved vendors
UPDATE vendors v
SET product_visibility = TRUE, updated_at = NOW()
FROM login l
WHERE v.id = l.user_id 
AND l.role = 'vendor'
AND l.is_approved = TRUE;
```

## Performance Optimization

```sql
-- Ensure index exists (already in migration, but you can verify)
CREATE INDEX IF NOT EXISTS idx_vendors_product_visibility 
ON vendors(product_visibility);

-- Check if index is being used
EXPLAIN ANALYZE
SELECT * FROM vendors WHERE product_visibility = FALSE;
```

## Data Integrity Checks

```sql
-- Verify no NULL values in product_visibility
SELECT COUNT(*) as null_count
FROM vendors
WHERE product_visibility IS NULL;

-- If NULLs exist, set them to default TRUE
UPDATE vendors 
SET product_visibility = TRUE
WHERE product_visibility IS NULL;
```


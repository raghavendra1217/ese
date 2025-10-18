-- Make remarks column optional in product_requests table
-- This script updates the existing table to allow NULL values for remarks

-- Check current table structure
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'product_requests' 
AND column_name = 'remarks';

-- Make remarks column nullable
ALTER TABLE product_requests ALTER COLUMN remarks DROP NOT NULL;

-- Verify the change
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'product_requests' 
AND column_name = 'remarks';

-- Update any existing empty string remarks to NULL for consistency
UPDATE product_requests 
SET remarks = NULL 
WHERE remarks = '';

-- Verify the update
SELECT 
    COUNT(*) as total_requests,
    COUNT(remarks) as requests_with_remarks,
    COUNT(*) - COUNT(remarks) as requests_without_remarks
FROM product_requests;

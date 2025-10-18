-- Fix for product request constraint: Only one pending request per user
-- This script adds a unique constraint to prevent multiple pending requests

-- First, let's check if there are any existing duplicate pending requests
SELECT user_id, COUNT(*) as pending_count 
FROM product_requests 
WHERE status = 'pending' 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- If there are duplicates, we need to handle them first
-- For now, let's add the constraint and let it fail if duplicates exist

-- Add unique constraint to prevent multiple pending requests per user
-- This creates a partial unique index that only applies when status = 'pending'
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_product_requests_unique_pending_per_user 
ON product_requests (user_id) 
WHERE status = 'pending';

-- Verify the constraint was created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'product_requests' 
AND indexname = 'idx_product_requests_unique_pending_per_user';

-- Add a comment to document this constraint
COMMENT ON INDEX idx_product_requests_unique_pending_per_user IS 'Ensures only one pending product request per user at a time';

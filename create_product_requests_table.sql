-- Create product_requests table for vendor product request functionality

CREATE TABLE IF NOT EXISTS product_requests (
    request_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    remarks TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    admin_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_product_requests_user_id ON product_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_product_requests_status ON product_requests(status);
CREATE INDEX IF NOT EXISTS idx_product_requests_created_at ON product_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_product_requests_user_status ON product_requests(user_id, status);

-- Add comments for documentation
COMMENT ON TABLE product_requests IS 'Stores vendor product requests for admin approval';
COMMENT ON COLUMN product_requests.request_id IS 'Unique identifier for each product request';
COMMENT ON COLUMN product_requests.user_id IS 'Reference to vendor who submitted the request';
COMMENT ON COLUMN product_requests.amount IS 'Requested amount in INR (must be positive)';
COMMENT ON COLUMN product_requests.remarks IS 'Vendor description of product requirements';
COMMENT ON COLUMN product_requests.status IS 'Current status: pending, approved, rejected, cancelled';
COMMENT ON COLUMN product_requests.admin_comment IS 'Admin notes or rejection reason';
COMMENT ON COLUMN product_requests.created_at IS 'When the request was submitted';
COMMENT ON COLUMN product_requests.updated_at IS 'Last modification timestamp';
COMMENT ON COLUMN product_requests.approved_at IS 'When the request was approved (if applicable)';
COMMENT ON COLUMN product_requests.rejected_at IS 'When the request was rejected (if applicable)';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_requests_updated_at
    BEFORE UPDATE ON product_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_product_requests_updated_at();

-- Verify table creation
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'product_requests' 
ORDER BY ordinal_position;

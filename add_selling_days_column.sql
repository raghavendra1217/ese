-- Add selling_days column to product table
ALTER TABLE product ADD COLUMN IF NOT EXISTS selling_days INTEGER DEFAULT 7;

-- Update existing products to have 7 days as default (matching current behavior)
UPDATE product 
SET selling_days = 7 
WHERE selling_days IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_product_selling_days ON product(selling_days);

-- Add comment
COMMENT ON COLUMN product.selling_days IS 'Number of days after purchase before vendor can sell at market price. Default is 7 days.';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'product' AND column_name = 'selling_days';

-- Add original_stock column to product table for quota system

-- Add the column
ALTER TABLE product ADD COLUMN IF NOT EXISTS original_stock BIGINT;

-- Set initial values for existing products
UPDATE product 
SET original_stock = available_stock 
WHERE original_stock IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_product_original_stock ON product(original_stock);

-- Add comment
COMMENT ON COLUMN product.original_stock IS 'Original stock quantity used for fair quota calculation. Updates when admin edits stock.';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'product' AND column_name = 'original_stock';


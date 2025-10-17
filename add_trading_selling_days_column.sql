-- Add selling_days column to trading table for regular products only
-- This locks the selling days value at purchase time, so product changes won't affect existing trades

ALTER TABLE trading ADD COLUMN IF NOT EXISTS selling_days INTEGER;

-- Update existing trades with current product selling_days values (only for regular products)
UPDATE trading t 
SET selling_days = COALESCE(p.selling_days, 7)
FROM product p 
WHERE t.product_id = p.product_id 
  AND t.selling_days IS NULL 
  AND t.product_id NOT LIKE 'WP_%';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_trading_selling_days ON trading(selling_days);

-- Add comment
COMMENT ON COLUMN trading.selling_days IS 'Selling days locked at purchase time for regular products - independent of product changes';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'trading' AND column_name = 'selling_days';

-- Show how many trades were updated
SELECT 
    COUNT(*) as total_trades,
    COUNT(selling_days) as trades_with_selling_days,
    COUNT(*) - COUNT(selling_days) as wild_product_trades
FROM trading;

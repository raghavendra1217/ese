-- Add product_visibility column to vendors table
-- This column controls whether vendors can see and purchase products
-- Default is TRUE (products visible)

ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS product_visibility BOOLEAN NOT NULL DEFAULT TRUE;

-- Create an index for better query performance when filtering by visibility
CREATE INDEX IF NOT EXISTS idx_vendors_product_visibility ON public.vendors(product_visibility);

-- Optional: Add a comment to document the column
COMMENT ON COLUMN public.vendors.product_visibility IS 'Controls whether this vendor can view and purchase products. Set to FALSE to hide products from this vendor.';

-- Show the current status of all vendors
SELECT id, vendor_name, email, product_visibility, created_at 
FROM public.vendors 
ORDER BY created_at DESC;


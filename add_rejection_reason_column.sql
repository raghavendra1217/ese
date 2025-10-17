-- Add rejection_reason column to investordetails table
-- This is optional - the rejection logic works without it

ALTER TABLE public.investordetails 
ADD COLUMN rejection_reason text;

-- Add comment to explain the column
COMMENT ON COLUMN public.investordetails.rejection_reason IS 'Reason for rejecting the investor application';

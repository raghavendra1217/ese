-- Add OCR column to resumes table
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS ocr TEXT;

-- Add comment to the new column
COMMENT ON COLUMN resumes.ocr IS 'OCR extracted text from the resume file';

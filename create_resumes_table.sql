-- Create resumes table
CREATE TABLE IF NOT EXISTS resumes (
    id BIGSERIAL PRIMARY KEY,
    resume_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    user_id VARCHAR(255),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_resumes_uploaded_at ON resumes(uploaded_at);

-- Add comment to table
COMMENT ON TABLE resumes IS 'Stores resume file information and URLs';
COMMENT ON COLUMN resumes.resume_url IS 'Public URL of the uploaded resume file in Supabase storage';
COMMENT ON COLUMN resumes.file_name IS 'Original filename of the uploaded resume';
COMMENT ON COLUMN resumes.file_size IS 'Size of the file in bytes';
COMMENT ON COLUMN resumes.mime_type IS 'MIME type of the file (e.g., application/pdf)';
COMMENT ON COLUMN resumes.user_id IS 'ID of the user who uploaded the resume';

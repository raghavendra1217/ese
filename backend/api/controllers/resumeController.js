// backend/api/controllers/resumeController.js

const db = require('../config/database');
const { supabaseAdmin, supabase } = require('../config/supabase');
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { pdf } = require('pdf-to-img');
const fs = require('fs');
const path = require('path');

// heolmslkn
/**
 * Extract text from uploaded file based on file type
 */
const extractText = async (file) => {
  try {
    console.log('🔍 Starting text extraction for file:', file.originalname);
    console.log('📦 File size:', file.size, 'bytes');
    console.log('📄 MIME type:', file.mimetype);
    
    let extractedText = '';
    
    // Handle different file types
    if (file.mimetype === 'application/pdf') {
      console.log('📕 Processing PDF file...');
      
      // First, try to extract text directly from PDF
      try {
        const pdfData = await pdfParse(file.buffer);
        extractedText = pdfData.text;
        console.log('✅ Direct PDF text extraction successful');
      } catch (pdfError) {
        console.log('⚠️  Direct PDF extraction failed, trying OCR on PDF pages...');
        
        // If direct extraction fails, convert PDF to images and OCR
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const tempPdfPath = path.join(tempDir, `temp_${Date.now()}.pdf`);
        fs.writeFileSync(tempPdfPath, file.buffer);
        
        try {
          const document = await pdf(tempPdfPath, { scale: 2.0 });
          let pageTexts = [];
          
          for await (const image of document) {
            console.log(`🔄 OCR on page ${image.pageNumber}...`);
            const { data: { text } } = await Tesseract.recognize(image, 'eng');
            pageTexts.push(text);
          }
          
          extractedText = pageTexts.join('\n\n');
          console.log('✅ PDF OCR completed successfully');
        } finally {
          // Clean up temp file
          if (fs.existsSync(tempPdfPath)) {
            fs.unlinkSync(tempPdfPath);
          }
        }
      }
      
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('📘 Processing DOCX file...');
      
      // Extract text from DOCX
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = result.value;
      console.log('✅ DOCX text extraction successful');
      
    } else if (file.mimetype === 'application/msword') {
      console.log('📙 Processing DOC file...');
      
      // For old DOC files, try mammoth (limited support)
      try {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        extractedText = result.value;
        console.log('✅ DOC text extraction successful');
      } catch (docError) {
        console.log('⚠️  DOC extraction not fully supported, text may be incomplete');
        extractedText = '';
      }
      
    } else if (file.mimetype.startsWith('image/')) {
      console.log('🖼️  Processing image file with OCR...');
      
      // Perform OCR on image
      const { data: { text } } = await Tesseract.recognize(
        file.buffer,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`🔄 OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );
      
      extractedText = text;
      console.log('✅ Image OCR completed successfully');
    }
    
    console.log('📝 Extracted text length:', extractedText.length, 'characters');
    
    return extractedText.trim();
    
  } catch (error) {
    console.error('❌ Text extraction failed:', error.message);
    console.error(error);
    // Return empty string if extraction fails, but don't stop the upload process
    return '';
  }
};

/**
 * Upload resume to Supabase storage and save details to database
 */
exports.uploadResume = async (req, res) => {
  const file = req.file;
  
  if (!file) {
    return res.status(400).json({ message: 'No file provided' });
  }

  // Use admin client if available, otherwise fall back to regular client
  const storageClient = supabaseAdmin || supabase;
  
  if (!storageClient) {
    return res.status(500).json({ 
      message: 'Supabase client not configured properly.' 
    });
  }

  // Validate file type (PDF, DOC, DOCX, Images)
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/webp'
  ];
  
  if (!allowedTypes.includes(file.mimetype)) {
    return res.status(400).json({ 
      message: 'Invalid file type. Only PDF, DOC, DOCX, and image files (JPG, PNG, GIF, BMP, TIFF, WEBP) are allowed.' 
    });
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return res.status(400).json({ 
      message: 'File too large. Maximum size is 10MB.' 
    });
  }

  const client = await db.connect();
  
  try {
    await client.query('BEGIN');

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `resume_${timestamp}.${fileExtension}`;
    const filePath = `resumes/${fileName}`;

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await storageClient.storage
      .from('Resumes')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = storageClient.storage
      .from('Resumes')
      .getPublicUrl(filePath);

    const resumeUrl = urlData.publicUrl;
    
    console.log('📄 Generated resume URL:', resumeUrl);
    console.log('📁 File path:', filePath);
    console.log('🪣 Bucket:', 'Resumes');

    // Extract text from the uploaded file
    const ocrText = await extractText(file);
    console.log('🔍 Extracted text length:', ocrText.length);

    // Save to database with OCR text
    const query = `
      INSERT INTO resumes (resume_url, file_name, file_size, mime_type, user_id, ocr)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [resumeUrl, file.originalname, file.size, file.mimetype, req.user?.user_id || null, ocrText];
    const { rows } = await client.query(query, values);

    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Resume uploaded successfully',
      resume: rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error uploading resume:', error);
    res.status(500).json({ 
      message: 'Failed to upload resume',
      error: error.message 
    });
  } finally {
    client.release();
  }
};

/**
 * Get all resumes
 */
exports.getAllResumes = async (req, res) => {
  try {
    let query, params;
    
    // If user is admin, show all resumes; otherwise show only their own
    if (req.user.role === 'admin') {
      query = `
        SELECT id, resume_url, file_name, file_size, mime_type, user_id, uploaded_at, ocr
        FROM resumes
        ORDER BY uploaded_at DESC
      `;
      params = [];
    } else {
      query = `
        SELECT id, resume_url, file_name, file_size, mime_type, user_id, uploaded_at, ocr
        FROM resumes
        WHERE user_id = $1
        ORDER BY uploaded_at DESC
      `;
      params = [req.user.user_id];
    }
    
    const client = await db.connect();
    try {
      const { rows } = await client.query(query, params);
      res.json(rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({ 
      message: 'Failed to fetch resumes', 
      error: error.message 
    });
  }
};

/**
 * Delete resume
 */
exports.deleteResume = async (req, res) => {
  const { id } = req.params;
  
  // Use admin client if available, otherwise fall back to regular client
  const storageClient = supabaseAdmin || supabase;
  
  if (!storageClient) {
    return res.status(500).json({ 
      message: 'Supabase client not configured properly.' 
    });
  }
  
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');

    // Get resume details first
    let query, params;
    if (req.user.role === 'admin') {
      query = 'SELECT resume_url FROM resumes WHERE id = $1';
      params = [id];
    } else {
      query = 'SELECT resume_url FROM resumes WHERE id = $1 AND user_id = $2';
      params = [id, req.user.user_id];
    }
    
    const { rows } = await client.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Resume not found or you do not have permission to delete it' });
    }

    const resumeUrl = rows[0].resume_url;
    
    // Extract file path from URL
    const urlParts = resumeUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `resumes/${fileName}`;

    // Delete from Supabase storage
    const { error: deleteError } = await storageClient.storage
      .from('Resumes')
      .remove([filePath]);

    if (deleteError) {
      console.warn('Failed to delete file from storage:', deleteError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    if (req.user.role === 'admin') {
      await client.query('DELETE FROM resumes WHERE id = $1', [id]);
    } else {
      await client.query('DELETE FROM resumes WHERE id = $1 AND user_id = $2', [id, req.user.user_id]);
    }

    await client.query('COMMIT');
    
    res.json({ message: 'Resume deleted successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting resume:', error);
    res.status(500).json({ 
      message: 'Failed to delete resume',
      error: error.message 
    });
  } finally {
    client.release();
  }
};

/**
 * Get signed URL for resume file access
 */
exports.getSignedUrl = async (req, res) => {
  const { id } = req.params;
  
  // Use admin client if available, otherwise fall back to regular client
  const storageClient = supabaseAdmin || supabase;
  
  if (!storageClient) {
    return res.status(500).json({ 
      message: 'Supabase client not configured properly.' 
    });
  }
  
  const client = await db.connect();
  
  try {
    // Get resume details first
    let query, params;
    if (req.user.role === 'admin') {
      query = 'SELECT resume_url, file_name FROM resumes WHERE id = $1';
      params = [id];
    } else {
      query = 'SELECT resume_url, file_name FROM resumes WHERE id = $1 AND user_id = $2';
      params = [id, req.user.user_id];
    }
    
    const { rows } = await client.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Resume not found or you do not have permission to access it' });
    }

    const resume = rows[0];
    
    // Extract file path from URL
    const urlParts = resume.resume_url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `resumes/${fileName}`;

    // Generate signed URL (valid for 1 hour)
    console.log('🔗 Generating signed URL for:', filePath);
    const { data: signedUrlData, error: signedUrlError } = await storageClient.storage
      .from('Resumes')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (signedUrlError) {
      console.error('❌ Signed URL generation failed:', signedUrlError);
      throw new Error(`Failed to generate signed URL: ${signedUrlError.message}`);
    }
    
    console.log('✅ Generated signed URL:', signedUrlData.signedUrl);

    res.json({
      signedUrl: signedUrlData.signedUrl,
      fileName: resume.file_name
    });

  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ 
      message: 'Failed to generate signed URL',
      error: error.message 
    });
  } finally {
    client.release();
  }
};

/**
 * Get OCR text for a specific resume
 */
exports.getOCRText = async (req, res) => {
  const { id } = req.params;
  
  const client = await db.connect();
  
  try {
    // Get OCR text for the resume
    let query, params;
    if (req.user.role === 'admin') {
      query = 'SELECT id, file_name, ocr FROM resumes WHERE id = $1';
      params = [id];
    } else {
      query = 'SELECT id, file_name, ocr FROM resumes WHERE id = $1 AND user_id = $2';
      params = [id, req.user.user_id];
    }
    
    const { rows } = await client.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Resume not found or you do not have permission to access it' });
    }

    const resume = rows[0];
    
    res.json({
      id: resume.id,
      fileName: resume.file_name,
      ocrText: resume.ocr || 'No OCR text available'
    });

  } catch (error) {
    console.error('Error fetching OCR text:', error);
    res.status(500).json({ 
      message: 'Failed to fetch OCR text',
      error: error.message 
    });
  } finally {
    client.release();
  }
};

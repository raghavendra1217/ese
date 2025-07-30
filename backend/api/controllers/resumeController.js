const db = require('../config/database');
const path = require('path');
const { uploadFileToR2 } = require('../utils/cloudflareR2'); // Import R2 utility

// The public-facing URL of your R2 bucket.
// This should be stored in your .env file for best practice, but is derived here from your other variables.
const R2_PUBLIC_URL = `${process.env.R2_PUBLIC_URL}`;

/**
 * Calculates the next sequential number for a given ID prefix (e.g., 'R_').
 * MUST be called within a transaction that has locked the target table.
 */
const getNextSequenceNumber = async (client, idColumn, prefix) => {
    const query = `
        SELECT ${idColumn} FROM resume
        WHERE ${idColumn} LIKE $1
        ORDER BY CAST(SUBSTRING(${idColumn} FROM ${prefix.length + 1}) AS INTEGER) DESC
        LIMIT 1
    `;
    const { rows } = await client.query(query, [`${prefix}%`]);

    if (rows.length === 0) {
        return 1;
    }
    const lastId = rows[0][idColumn];
    const lastNumber = parseInt(lastId.substring(prefix.length), 10);
    return lastNumber + 1;
};

/**
 * Formats a number into a prefixed, zero-padded ID string.
 */
const formatId = (prefix, number) => {
    return `${prefix}${String(number).padStart(3, '0')}`;
};

/**
 * Handles the bulk upload of resume files directly to Cloudflare R2.
 * The process is transactional to ensure data integrity.
 */
exports.handleBulkUpload = async (req, res) => {
    const uploadedFiles = req.files;

    if (!uploadedFiles || uploadedFiles.length === 0) {
        return res.status(400).json({ message: 'No files were uploaded.' });
    }

    const client = await db.connect();
    // This array will hold the necessary info to perform R2 uploads after the DB commit.
    const uploadJobs = [];

    try {
        await client.query('BEGIN');
        await client.query('LOCK TABLE resume IN EXCLUSIVE MODE');

        const startResumeNum = await getNextSequenceNumber(client, 'resume_id', 'R_');
        const startTaskNum = await getNextSequenceNumber(client, 'task_id', 'T_');

        const resumeValues = [];
        const queryParams = [];

        uploadedFiles.forEach((file, index) => {
            const resume_id = formatId('R_', startResumeNum + index);
            const task_id = formatId('T_', startTaskNum + index);
            
            // Define the final filename and its destination folder in R2.
            const newFilename = `${resume_id}${path.extname(file.originalname)}`;
            const destinationFolder = 'resumes';
            
            // Construct the final, public URL that the file WILL have once uploaded.
            // This URL is stored in the database.
            const resume_url = `${R2_PUBLIC_URL}/${destinationFolder}/${newFilename}`;
            
            // Prepare the data for the bulk INSERT query.
            const paramIndex = resumeValues.length * 4;
            resumeValues.push(`($${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4})`);
            queryParams.push(resume_id, task_id, resume_url, 'not assigned');

            // Add the file object and its details to our list of upload jobs.
            uploadJobs.push({ file, destinationFolder, newFilename });
        });

        const insertQuery = `
            INSERT INTO resume (resume_id, task_id, resume_url, task_status)
            VALUES ${resumeValues.join(', ')}
        `;
        await client.query(insertQuery, queryParams);

        // If the database insert is successful, commit the transaction.
        await client.query('COMMIT');

        // --- Perform R2 Uploads AFTER the database transaction is successful ---
        // This ensures we don't upload files for database records that were never created.
        try {
            const uploadPromises = uploadJobs.map(job =>
                uploadFileToR2(job.file, job.destinationFolder, job.newFilename)
            );
            await Promise.all(uploadPromises);
        } catch (uploadError) {
            // This is a critical failure case where the DB is updated but file storage failed.
            // This requires manual intervention, so we log it conspicuously.
            console.error('🔥🔥🔥 CRITICAL: Database commit succeeded, but R2 upload failed. Manual intervention may be required to upload files for the created resume records.', uploadError);
            return res.status(500).json({ message: 'Database updated, but failed to store one or more files in the cloud. Please contact support.' });
        }

        res.status(201).json({ message: `${uploadedFiles.length} resume(s) uploaded successfully!` });

    } catch (error) {
        // If any database error occurs, roll back all DB changes.
        await client.query('ROLLBACK');
        console.error('❌ Error during bulk resume upload:', error);
        res.status(500).json({ message: 'An error occurred during the database operation. No files were saved.' });
    } finally {
        // Always release the database client back to the pool.
        // No local file cleanup is necessary.
        client.release();
    }
};

/**
 * Fetches dashboard statistics related ONLY to resumes.
 * (No changes are needed for this function).
 */
exports.getDashboardStats = async (req, res) => {
    try {
        const query = `
            SELECT
                COUNT(*) as "totalResumes",
                COUNT(*) FILTER (WHERE task_status = 'not assigned') as "pendingAssignment"
            FROM resume
        `;
        const { rows } = await db.query(query);
        const statsData = rows[0];

        const stats = {
            uploadedResume: parseInt(statsData.totalResumes, 10),
            pendingForApproval: parseInt(statsData.pendingAssignment, 10),
        };
        
        res.status(200).json(stats);

    } catch (error) {
        console.error('❌ Error fetching resume dashboard stats:', error);
        res.status(500).json({ message: 'Failed to fetch resume statistics.' });
    }
};
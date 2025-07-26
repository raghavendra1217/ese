const db = require('../config/database');
const fs = require('fs');
const path = require('path');

/**
 * Calculates the next sequential number for a given ID prefix (e.g., 'R_' or 'T_').
 * IMPORTANT: This must be called within a transaction that has locked the target table
 * to prevent race conditions where two parallel requests get the same sequence number.
 * @param {object} client - The active database client from the connection pool.
 * @param {string} idColumn - The name of the ID column (e.g., 'resume_id').
 * @param {string} prefix - The prefix of the ID (e.g., 'R_').
 * @returns {Promise<number>} The next integer in the sequence.
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
        return 1; // Start from 1 if no records with this prefix exist
    }

    const lastId = rows[0][idColumn];
    const lastNumber = parseInt(lastId.substring(prefix.length), 10);
    return lastNumber + 1;
};

/**
 * Formats a number into a prefixed, zero-padded ID string.
 * @param {string} prefix - The prefix (e.g., 'R_').
 * @param {number} number - The sequence number.
 * @returns {string} The formatted ID (e.g., 'R_001').
 */
const formatId = (prefix, number) => {
    return `${prefix}${String(number).padStart(3, '0')}`;
};

/**
 * Handles the bulk upload of resume files, creating corresponding database records.
 * This process is transactional to ensure data consistency and atomicity.
 */
exports.handleBulkUpload = async (req, res) => {
    const uploadedFiles = req.files;

    if (!uploadedFiles || uploadedFiles.length === 0) {
        return res.status(400).json({ message: 'No files were uploaded.' });
    }

    const client = await db.connect();
    let committed = false; // Flag to track if the transaction was successful

    try {
        await client.query('BEGIN');

        // Lock the table to prevent concurrent uploads from creating duplicate IDs.
        // This is crucial for maintaining a correct and gapless sequence.
        await client.query('LOCK TABLE resume IN EXCLUSIVE MODE');

        // Get the starting sequence number for both resume and task IDs.
        const startResumeNum = await getNextSequenceNumber(client, 'resume_id', 'R_');
        const startTaskNum = await getNextSequenceNumber(client, 'task_id', 'T_');

        const resumeValues = [];
        const queryParams = [];
        const filesToRename = [];

        uploadedFiles.forEach((file, index) => {
            const resume_id = formatId('R_', startResumeNum + index);
            const task_id = formatId('T_', startTaskNum + index);
            
            // Generate the final filename and URL path.
            const newFilename = `${resume_id}${path.extname(file.originalname)}`;
            const resume_url = `/resumes/${newFilename}`;
            
            // Prepare data for a single, efficient bulk insert query.
            const paramIndex = resumeValues.length * 4;
            resumeValues.push(`($${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4})`);
            queryParams.push(resume_id, task_id, resume_url, 'not assigned');

            // Keep track of file paths for renaming after the transaction commits.
            filesToRename.push({
                tempPath: file.path,
                finalPath: path.join(path.dirname(file.path), newFilename)
            });
        });

        // Construct and execute the single bulk insert query for performance.
        const insertQuery = `
            INSERT INTO resume (resume_id, task_id, resume_url, task_status)
            VALUES ${resumeValues.join(', ')}
        `;
        await client.query(insertQuery, queryParams);

        // If the database insert is successful, commit the transaction.
        await client.query('COMMIT');
        committed = true;

        // Only after a successful commit, rename the files on the filesystem.
        for (const file of filesToRename) {
            fs.renameSync(file.tempPath, file.finalPath);
        }

        res.status(201).json({ message: `${uploadedFiles.length} resume(s) uploaded successfully!` });

    } catch (error) {
        // If any error occurs, roll back the database changes.
        await client.query('ROLLBACK');
        console.error('❌ Error during bulk resume upload:', error);
        res.status(500).json({ message: 'An error occurred during the upload process. No files were saved.' });
    } finally {
        // IMPORTANT: Clean up temporary files if the transaction failed.
        if (!committed) {
            for (const file of uploadedFiles) {
                // Check if the temp file still exists before trying to delete it.
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            }
        }
        // Always release the database client back to the pool.
        client.release();
    }
};

/**
 * Fetches dashboard statistics related ONLY to resumes.
 * This provides a clean separation of concerns for the API.
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

        // Keys here must match what the frontend dashboard component expects.
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
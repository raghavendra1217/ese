// backend/api/controllers/resumeController.js

const db = require('../config/database');
const fs = require('fs');
const path = require('path');

const getNextSequence = async (client, tableName, idColumn, prefix) => {
    const query = `
        SELECT ${idColumn} FROM ${tableName}
        WHERE ${idColumn} LIKE $1
        ORDER BY CAST(SUBSTRING(${idColumn} FROM ${prefix.length + 1}) AS INTEGER) DESC
        LIMIT 1
    `;
    const { rows } = await client.query(query, [`${prefix}%`]);
    if (rows.length === 0) return 1;
    const lastId = rows[0][idColumn];
    const lastNumber = parseInt(lastId.substring(prefix.length), 10);
    return lastNumber + 1;
};

const formatId = (prefix, number) => {
    return `${prefix}${number.toString().padStart(3, '0')}`;
};

exports.handleBulkUpload = async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files were uploaded.' });
    }
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('LOCK TABLE resume IN EXCLUSIVE MODE');
        
        let nextResumeNum = await getNextSequence(client, 'resume', 'resume_id', 'R_');
        let nextTaskNum = await getNextSequence(client, 'resume', 'task_id', 'T_');

        const insertPromises = req.files.map((file, index) => {
            const resume_id = formatId('R_', nextResumeNum + index);
            const task_id = formatId('T_', nextTaskNum + index);
            
            const newFilename = `${resume_id}${path.extname(file.originalname)}`;
            const resume_url = `/resumes/${newFilename}`;
            const task_status = 'not assigned';
            
            file.finalPath = path.join(path.dirname(file.path), newFilename); 

            const query = `
                INSERT INTO resume (resume_id, task_id, resume_url, task_status, employee_id, vendor_id)
                VALUES ($1, $2, $3, $4, NULL, NULL)
            `;
            return client.query(query, [resume_id, task_id, resume_url, task_status]);
        });
        await Promise.all(insertPromises);

        for (const file of req.files) {
            fs.renameSync(file.path, file.finalPath);
        }
        await client.query('COMMIT');
        res.status(201).json({ message: `${req.files.length} resume(s) uploaded successfully!` });
    } catch (error) {
        await client.query('ROLLBACK');
        for (const file of req.files) {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        }
        console.error('❌ Error during bulk resume upload:', error);
        res.status(500).json({ message: 'An error occurred during the upload process.' });
    } finally {
        client.release();
    }
};

// In backend/api/controllers/resumeController.js, update getDashboardStats
// backend/api/controllers/resumeController.js

// ... (handleBulkUpload function remains the same) ...

// --- CLEANED UP FUNCTION ---
exports.getDashboardStats = async (req, res) => {
    try {
        const resumeCountResult = await db.query('SELECT COUNT(*) FROM resume');
        const pendingResumeResult = await db.query("SELECT COUNT(*) FROM resume WHERE task_status = 'not assigned'");
        
        // THE FIX: This function now ONLY returns RESUME stats.
        const stats = {
            uploadedResume: parseInt(resumeCountResult.rows[0].count, 10),
            pendingForApproval: parseInt(pendingResumeResult.rows[0].count, 10),
        };
        
        res.status(200).json(stats);

    } catch (error) {
        console.error('❌ Error fetching resume stats:', error);
        res.status(500).json({ message: 'Failed to fetch resume statistics.' });
    }
};
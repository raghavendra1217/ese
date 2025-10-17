// backend/api/controllers/investorController.js

const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { calculateDisbursementSchedule, createDisbursementSchedule, getDisbursementSchedule, updateDisbursementSchedule } = require('../utils/disbursementCalculator');

/**
 * Generate PDF and save to uploads folder
 */
async function generateAndSavePDF(investorId, investor) {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(`📄 Starting PDF generation for investor ${investorId}...`);
            console.log(`📊 Investor data:`, {
                id: investor.id,
                name: investor.first_name,
                select_plan: investor.select_plan,
                plan_type: investor.plan_type,
                investment_date: investor.investment_date
            });
            
            // Get disbursement schedule
            console.log(`🔍 Fetching disbursement schedule for investor ${investorId}...`);
            let disbursementSchedule = await getDisbursementSchedule(db, investorId);
            
            // If no disbursement schedule exists, create one
            if (!disbursementSchedule) {
                console.log(`⚠️ No disbursement schedule found for investor ${investorId}, creating one...`);
                try {
                    const investmentAmount = investor.select_plan === '50k' ? 50000 : 100000;
                    console.log(`💰 Investment amount calculated: ${investmentAmount}`);
                    
                    const scheduleData = calculateDisbursementSchedule({
                        investmentAmount,
                        selectPlan: investor.select_plan,
                        planType: investor.plan_type || '60 days',
                        investmentDate: investor.investment_date || new Date()
                    });
                    
                    console.log(`📅 Schedule data calculated:`, scheduleData);
                    await createDisbursementSchedule(db, scheduleData, investorId);
                    disbursementSchedule = await getDisbursementSchedule(db, investorId);
                    console.log(`✅ Created disbursement schedule for investor ${investorId}`);
                } catch (error) {
                    console.error(`❌ Error creating disbursement schedule for investor ${investorId}:`, {
                        message: error.message,
                        stack: error.stack,
                        investorId: investorId,
                        investorData: investor
                    });
                    disbursementSchedule = null;
                }
            } else {
                console.log(`✅ Found existing disbursement schedule for investor ${investorId}`);
            }
            
            // Prepare data for PDF generation
            console.log(`📝 Preparing PDF data for investor ${investorId}...`);
            const pdfData = {
                investor: {
                    id: investor.id,
                    first_name: investor.first_name,
                    mobile_number: investor.mobile_number,
                    bank_account_number: investor.bank_account_number,
                    bank_name: investor.bank_name,
                    branch_name: investor.branch_name,
                    ifsc_code: investor.ifsc_code || 'N/A',
                    address: investor.address,
                    select_plan: investor.select_plan,
                    investment_date: investor.investment_date ? 
                        new Date(investor.investment_date).toISOString().split('T')[0] : 'N/A'
                },
                disbursement_schedule: disbursementSchedule ? {
                    investment_amount: disbursementSchedule.investment_amount,
                    total_return: disbursementSchedule.total_return,
                    duration_days: disbursementSchedule.duration_days,
                    interval_days: disbursementSchedule.interval_days,
                    num_disbursements: disbursementSchedule.num_disbursements,
                    amount_per_disbursement: disbursementSchedule.amount_per_disbursement,
                    disbursement_dates: disbursementSchedule.disbursements.map(d => 
                        new Date(d.disbursement_date).toISOString().split('T')[0]
                    )
                } : null
            };
            
            console.log(`📋 PDF data prepared:`, {
                investorName: pdfData.investor.first_name,
                investmentAmount: pdfData.investor.select_plan === '50k' ? 50000 : 100000,
                disbursementCount: pdfData.disbursement_schedule?.disbursement_dates?.length || 0,
                hasDisbursementSchedule: !!pdfData.disbursement_schedule
            });
            
            // Create temporary JSON file
            console.log(`📁 Creating temporary JSON file for investor ${investorId}...`);
            const tempDir = path.join(__dirname, '../../temp');
            console.log(`📂 Temp directory: ${tempDir}`);
            
            try {
                if (!fs.existsSync(tempDir)) {
                    console.log(`📁 Creating temp directory: ${tempDir}`);
                    fs.mkdirSync(tempDir, { recursive: true });
                }
                
                const tempJsonFile = path.join(tempDir, `investor_${investorId}_${Date.now()}.json`);
                console.log(`📄 Writing JSON data to: ${tempJsonFile}`);
                fs.writeFileSync(tempJsonFile, JSON.stringify(pdfData, null, 2));
                console.log(`✅ JSON file created successfully`);
            } catch (fileError) {
                console.error(`❌ Error creating temporary JSON file:`, {
                    message: fileError.message,
                    stack: fileError.stack,
                    tempDir: tempDir,
                    investorId: investorId
                });
                throw fileError;
            }
            
            // Call Python script to generate PDF
            const pythonScript = path.join(__dirname, '../../pdf_generator/investor_report_generator_v2.py');
            const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
            
            console.log(`🐍 Python execution details:`, {
                command: pythonCommand,
                script: pythonScript,
                jsonFile: tempJsonFile,
                platform: process.platform,
                workingDirectory: path.join(__dirname, '../../pdf_generator')
            });
            
            console.log(`🚀 Starting Python process for investor ${investorId}...`);
            const pythonProcess = spawn(pythonCommand, [pythonScript, tempJsonFile], {
                cwd: path.join(__dirname, '../../pdf_generator')
            });
            
            let output = '';
            let errorOutput = '';
            
            pythonProcess.stdout.on('data', (data) => {
                const dataStr = data.toString();
                output += dataStr;
                console.log(`🐍 Python stdout: ${dataStr.trim()}`);
            });
            
            pythonProcess.stderr.on('data', (data) => {
                const dataStr = data.toString();
                errorOutput += dataStr;
                console.log(`🐍 Python stderr: ${dataStr.trim()}`);
            });
            
            pythonProcess.on('error', (error) => {
                console.error(`❌ Python process error for investor ${investorId}:`, {
                    message: error.message,
                    stack: error.stack,
                    command: pythonCommand,
                    script: pythonScript,
                    jsonFile: tempJsonFile
                });
                reject(error);
            });
            
            pythonProcess.on('close', async (code) => {
                console.log(`🐍 Python process completed for investor ${investorId} with exit code: ${code}`);
                console.log(`📊 Python output:`, output);
                
                // Clean up temp JSON file
                try {
                    if (fs.existsSync(tempJsonFile)) {
                        fs.unlinkSync(tempJsonFile);
                        console.log(`🗑️ Cleaned up temp JSON file: ${tempJsonFile}`);
                    }
                } catch (cleanupError) {
                    console.error(`⚠️ Error cleaning up temp JSON file:`, cleanupError.message);
                }
                
                if (code !== 0) {
                    console.error(`❌ Python script failed for investor ${investorId}:`, {
                        exitCode: code,
                        errorOutput: errorOutput,
                        stdout: output,
                        command: pythonCommand,
                        script: pythonScript,
                        jsonFile: tempJsonFile
                    });
                    reject(new Error(`Python script failed with code ${code}: ${errorOutput}`));
                    return;
                }
                
                try {
                    // Get the generated PDF filename
                    const investorName = investor.first_name.replace(/\s+/g, '_');
                    const investmentId = `NG${String(investor.id).padStart(5, '0')}`;
                    const pdfFilename = `NG_Investment_Summary_${investorName}_${investmentId}.pdf`;
                    const sourcePdfPath = path.join(__dirname, '../../pdf_generator', pdfFilename);
                    
                    console.log(`📄 PDF file details:`, {
                        filename: pdfFilename,
                        sourcePath: sourcePdfPath,
                        investorName: investorName,
                        investmentId: investmentId
                    });
                    
                    // Check if source PDF exists
                    if (!fs.existsSync(sourcePdfPath)) {
                        console.error(`❌ Source PDF not found: ${sourcePdfPath}`);
                        reject(new Error(`Generated PDF not found at: ${sourcePdfPath}`));
                        return;
                    }
                    
                    // Get file stats
                    const fileStats = fs.statSync(sourcePdfPath);
                    console.log(`📊 PDF file stats:`, {
                        size: fileStats.size,
                        created: fileStats.birthtime,
                        modified: fileStats.mtime
                    });
                    
                    // Create uploads directory if it doesn't exist
                    const uploadsDir = path.join(__dirname, '../../uploads');
                    console.log(`📁 Uploads directory: ${uploadsDir}`);
                    
                    if (!fs.existsSync(uploadsDir)) {
                        console.log(`📁 Creating uploads directory: ${uploadsDir}`);
                        fs.mkdirSync(uploadsDir, { recursive: true });
                    }
                    
                    // Copy PDF to uploads folder
                    const destPdfPath = path.join(uploadsDir, pdfFilename);
                    console.log(`📋 Copying PDF from ${sourcePdfPath} to ${destPdfPath}`);
                    
                    fs.copyFileSync(sourcePdfPath, destPdfPath);
                    console.log(`✅ PDF copied successfully to uploads`);
                    
                    // Verify the copy
                    if (fs.existsSync(destPdfPath)) {
                        const destStats = fs.statSync(destPdfPath);
                        console.log(`✅ PDF copy verified:`, {
                            destination: destPdfPath,
                            size: destStats.size,
                            created: destStats.birthtime
                        });
                    } else {
                        console.error(`❌ PDF copy verification failed: ${destPdfPath}`);
                    }
                    
                    // Clean up source PDF
                    try {
                        if (fs.existsSync(sourcePdfPath)) {
                            fs.unlinkSync(sourcePdfPath);
                            console.log(`🗑️ Cleaned up source PDF: ${sourcePdfPath}`);
                        }
                    } catch (cleanupError) {
                        console.error(`⚠️ Error cleaning up source PDF:`, cleanupError.message);
                    }
                    
                    console.log(`🎉 PDF generation completed successfully for investor ${investorId}`);
                    resolve(destPdfPath);
                    
                } catch (error) {
                    console.error(`❌ Error moving PDF to uploads for investor ${investorId}:`, {
                        message: error.message,
                        stack: error.stack,
                        investorId: investorId,
                        pdfFilename: pdfFilename,
                        sourcePdfPath: sourcePdfPath,
                        uploadsDir: uploadsDir
                    });
                    reject(error);
                }
            });
            
        } catch (error) {
            console.error('Error in generateAndSavePDF:', error);
            reject(error);
        }
    });
}

/**
 * CREATE: Add a new investor
 */
exports.addInvestor = async (req, res) => {
    const {
        first_name,
        mobile_number,
        pan_card,
        coordinator_id,
        co_name,
        bank_account_number,
        bank_name,
        branch_name,
        ifsc_code,
        mode_of_payment,
        plan_type,
        select_plan,
        transaction_id,
        address,
        investment_date
    } = req.body;

    // Validate required fields
    if (!first_name || !mobile_number) {
        return res.status(400).json({
            message: 'First name and mobile number are required.'
        });
    }

    // Determine coordinator_id and coordinator_name
    let finalCoordinatorId = coordinator_id;
    let coordinator_name;

    // If user is a coordinator and no coordinator_id provided, assign to themselves
    if (req.user.role === 'coordinator' && !coordinator_id) {
        finalCoordinatorId = req.user.user_id;
    }

    // If coordinator_id is provided or determined, validate it
    if (finalCoordinatorId) {
        const coordinatorQuery = 'SELECT name FROM coordinator WHERE coordinator_id = $1';
        const coordinatorResult = await db.query(coordinatorQuery, [finalCoordinatorId]);

        if (coordinatorResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid coordinator selected.' });
        }

        coordinator_name = coordinatorResult.rows[0].name;
    } else {
        return res.status(400).json({
            message: 'Coordinator assignment is required.'
        });
    }

    // Validate transaction_id if provided
    if (transaction_id) {
        const existingInvestor = await db.query(
            'SELECT id FROM investordetails WHERE transaction_id = $1',
            [transaction_id]
        );
        
        if (existingInvestor.rows.length > 0) {
            return res.status(400).json({
                message: 'Transaction ID already exists. Please use a different transaction ID.'
            });
        }
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const query = `
            INSERT INTO investordetails (
                first_name, mobile_number, pan_card, coordinator, coordinator_id, co_name,
                bank_account_number, bank_name, branch_name, ifsc_code, mode_of_payment,
                plan_type, select_plan, transaction_id,
                address, investment_date, approval_status, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'pending', NOW())
            RETURNING *;
        `;

        const params = [
            first_name, mobile_number, pan_card, coordinator_name, finalCoordinatorId, co_name,
            bank_account_number, bank_name, branch_name, ifsc_code, mode_of_payment,
            plan_type, select_plan, transaction_id,
            address, investment_date
        ];
        
        const { rows } = await client.query(query, params);
        const investor = rows[0];
        
        // Calculate and create disbursement schedule if plan details are provided
        if (select_plan && plan_type && investment_date) {
            try {
                // Convert select_plan to investment amount
                let investmentAmount;
                if (select_plan === '5k') {
                    investmentAmount = 5000;
                } else if (select_plan === '50k') {
                    investmentAmount = 50000;
                } else if (select_plan === '1 lakh') {
                    investmentAmount = 100000;
                } else if (select_plan === '5 lakh') {
                    investmentAmount = 500000;
                } else if (select_plan === '10 lakh') {
                    investmentAmount = 1000000;
                } else {
                    investmentAmount = 100000; // Default fallback
                }
                
                const scheduleData = calculateDisbursementSchedule({
                    investmentAmount,
                    selectPlan: select_plan,
                    planType: plan_type,
                    investmentDate: investment_date
                });
                
                await createDisbursementSchedule(client, scheduleData, investor.id);
                console.log('✅ Disbursement schedule created for investor:', investor.id);
            } catch (scheduleError) {
                console.error('❌ Error creating disbursement schedule:', scheduleError);
                // Don't fail the investor creation if schedule creation fails
            }
        }
        
        await client.query('COMMIT');
        
        // Generate PDF report automatically and save to uploads folder
        console.log(`📄 Starting PDF generation for newly created investor ${investor.id}...`);
        try {
            const pdfPath = await generateAndSavePDF(investor.id, investor);
            console.log(`✅ PDF generation successful for investor ${investor.id}:`, pdfPath);
            
            const pdfUrl = `${req.protocol}://${req.get('host')}/uploads/${path.basename(pdfPath)}`;
            console.log(`🔗 PDF URL generated: ${pdfUrl}`);
            
             res.status(201).json({
                 message: 'Investor added successfully. Pending admin approval.',
                 investor,
                 pdfPath: pdfPath,
                 pdfUrl: pdfUrl
             });
        } catch (pdfError) {
            console.error(`❌ PDF generation failed for investor ${investor.id}:`, {
                message: pdfError.message,
                stack: pdfError.stack,
                investorId: investor.id,
                investorData: investor
            });
            
             res.status(201).json({
                 message: 'Investor added successfully. Pending admin approval.',
                 investor,
                 note: 'PDF generation failed',
                 pdfError: pdfError.message
             });
        }

    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch (rollbackError) {
            console.error('❌ Error during rollback:', rollbackError.message);
        }
        console.error('❌ Error adding investor:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            stack: error.stack
        });
        
        // Provide more specific error messages
        let errorMessage = 'Failed to add investor.';
        if (error.code === '23505') {
            errorMessage = 'Investor with this information already exists.';
        } else if (error.code === '23503') {
            errorMessage = 'Invalid reference data provided.';
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Database connection failed. Please try again.';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Request timed out. Please try again.';
        }
        
        res.status(500).json({ 
            message: errorMessage,
            error: error.message 
        });
    } finally {
        try {
            client.release();
        } catch (releaseError) {
            console.error('❌ Error releasing client:', releaseError.message);
        }
    }
};

/**
 * READ: Get all investors - shows all investors regardless of approval status
 */
exports.getAllInvestors = async (req, res) => {
    try {
        const query = `
            SELECT
                id, first_name, mobile_number, pan_card, coordinator, co_name,
                bank_account_number, bank_name, branch_name, ifsc_code, mode_of_payment,
                plan_type, select_plan, transaction_id, address, investment_date,
                approval_status, approved_by, approved_at, created_at
            FROM investordetails
            ORDER BY investment_date DESC NULLS LAST
        `;
        const { rows } = await db.query(query);
        console.log('🔍 Investors fetched:', rows.length, 'investors (all statuses)');
        res.status(200).json(rows);
    } catch (error) {
        console.error('❌ Error fetching investors:', error);
        res.status(500).json({ message: 'Failed to fetch investors.' });
    }
};

/**
 * READ: Get investor by ID
 */
exports.getInvestorById = async (req, res) => {
    const { id } = req.params;
    
    try {
        const query = 'SELECT * FROM investordetails WHERE id = $1';
        const { rows } = await db.query(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Investor not found.' });
        }
        
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('❌ Error fetching investor:', error);
        res.status(500).json({ message: 'Failed to fetch investor.' });
    }
};

/**
 * UPDATE: Update investor details
 */
exports.updateInvestor = async (req, res) => {
    const { id } = req.params;
    const {
        first_name,
        mobile_number,
        pan_card,
        coordinator_id,
        co_name,
        bank_account_number,
        bank_name,
        branch_name,
        ifsc_code,
        mode_of_payment,
        plan_type,
        select_plan,
        transaction_id,
        address,
        investment_date
    } = req.body;

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Get coordinator name from coordinator_id if provided
        let coordinator_name = null;
        if (coordinator_id) {
            const coordinatorQuery = 'SELECT name FROM coordinator WHERE coordinator_id = $1';
            const coordinatorResult = await client.query(coordinatorQuery, [coordinator_id]);
            if (coordinatorResult.rows.length > 0) {
                coordinator_name = coordinatorResult.rows[0].name;
            }
        }

        const query = `
            UPDATE investordetails
            SET
                first_name = $1, mobile_number = $2, pan_card = $3,
                coordinator = COALESCE($4, coordinator),
                coordinator_id = COALESCE($5, coordinator_id),
                co_name = $6, bank_account_number = $7, bank_name = $8, branch_name = $9, ifsc_code = $10,
                mode_of_payment = $11, plan_type = $12, select_plan = $13,
                transaction_id = $14, address = $15,
                investment_date = $16
            WHERE id = $17
            RETURNING *;
        `;

        const params = [
            first_name, mobile_number, pan_card, coordinator_name, coordinator_id, co_name,
            bank_account_number, bank_name, branch_name, ifsc_code, mode_of_payment,
            plan_type, select_plan, transaction_id,
            address, investment_date, id
        ];
        
        const { rows } = await client.query(query, params);
        
        if (rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Investor not found.' });
        }
        
        // Update disbursement schedule if plan details changed
        if (select_plan && plan_type && investment_date) {
            try {
                console.log(`🔄 Updating disbursement schedule for investor ${id} with new data:`, {
                    select_plan,
                    plan_type,
                    investment_date
                });
                
                const { calculateDisbursementSchedule, createDisbursementSchedule } = require('../utils/disbursementCalculator');
                
                // Calculate investment amount
                let investmentAmount;
                if (select_plan === '5k') {
                    investmentAmount = 5000;
                } else if (select_plan === '10k') {
                    investmentAmount = 10000;
                } else if (select_plan === '50k') {
                    investmentAmount = 50000;
                } else if (select_plan === '1 lakh') {
                    investmentAmount = 100000;
                } else if (select_plan === '5 lakh') {
                    investmentAmount = 500000;
                } else if (select_plan === '10 lakh') {
                    investmentAmount = 1000000;
                } else {
                    investmentAmount = 100000; // Default fallback
                }
                
                // Calculate new disbursement schedule
                const scheduleData = calculateDisbursementSchedule({
                    investmentAmount,
                    selectPlan: select_plan,
                    planType: plan_type,
                    investmentDate: investment_date
                });
                
                console.log(`📊 Calculated new schedule data:`, {
                    investmentAmount,
                    selectPlan: select_plan,
                    planType: plan_type,
                    investmentDate: investment_date,
                    disbursementDates: scheduleData.disbursementDates
                });
                
                // Delete existing disbursement details
                const deleteDetailsQuery = `
                    DELETE FROM disbursement_detail 
                    WHERE schedule_id IN (
                        SELECT id FROM disbursement_schedules WHERE investor_id = $1
                    )
                `;
                await client.query(deleteDetailsQuery, [id]);
                
                // Delete existing disbursement schedule
                const deleteScheduleQuery = `
                    DELETE FROM disbursement_schedules WHERE investor_id = $1
                `;
                await client.query(deleteScheduleQuery, [id]);
                
                // Create new disbursement schedule
                await createDisbursementSchedule(client, scheduleData, id);
                console.log('✅ Disbursement schedule updated for investor:', id);
                
                // Verify the schedule was created
                const verifyQuery = `
                    SELECT ds.*, dd.disbursement_date, dd.disbursement_amount 
                    FROM disbursement_schedules ds
                    LEFT JOIN disbursement_detail dd ON ds.id = dd.schedule_id
                    WHERE ds.investor_id = $1
                    ORDER BY dd.disbursement_number
                `;
                const { rows: verifyRows } = await client.query(verifyQuery, [id]);
                console.log(`🔍 Verified disbursement schedule for investor ${id}:`, verifyRows);
            } catch (scheduleError) {
                console.error('❌ Error updating disbursement schedule:', scheduleError);
                // Don't fail the investor update if schedule update fails
            }
        }

        await client.query('COMMIT');
        res.status(200).json(rows[0]);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error updating investor:', error);
        res.status(500).json({ message: 'Failed to update investor.' });
    } finally {
        client.release();
    }
};

/**
 * DELETE: Delete investor
 */
exports.deleteInvestor = async (req, res) => {
    const { id } = req.params;
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const query = 'DELETE FROM investordetails WHERE id = $1 RETURNING *';
        const { rows } = await client.query(query, [id]);
        
        if (rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Investor not found.' });
        }
        
        await client.query('COMMIT');
        res.status(200).json({ message: 'Investor deleted successfully.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error deleting investor:', error);
        res.status(500).json({ message: 'Failed to delete investor.' });
    } finally {
        client.release();
    }
};

/**
 * GET: Get investor statistics for dashboard
 */
exports.getInvestorStats = async (req, res) => {
    try {
        const query = `
            SELECT 
                COUNT(*) as total_investors,
                COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today_investors,
                COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as last_7_days_investors
            FROM investordetails
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('❌ Error fetching investor stats:', error);
        res.status(500).json({ message: 'Failed to fetch investor statistics.' });
    }
};

/**
 * GET: Get disbursement schedule for an investor
 */
exports.getDisbursementSchedule = async (req, res) => {
    const { id } = req.params;
    
    try {
        const schedule = await getDisbursementSchedule(db, id);
        
        if (!schedule) {
            return res.status(404).json({ message: 'No disbursement schedule found for this investor.' });
        }
        
        res.status(200).json(schedule);
    } catch (error) {
        console.error('❌ Error fetching disbursement schedule:', error);
        res.status(500).json({ message: 'Failed to fetch disbursement schedule.' });
    }
};

/**
 * GET: Get all disbursement schedules - only for approved investors
 */
exports.getAllDisbursementSchedules = async (req, res) => {
    try {
        const query = `
            SELECT 
                ds.*,
                i.first_name,
                i.mobile_number,
                i.approval_status,
                COUNT(dd.id) as total_disbursements,
                COUNT(CASE WHEN dd.status = 'paid' THEN 1 END) as paid_disbursements,
                COUNT(CASE WHEN dd.status = 'pending' THEN 1 END) as pending_disbursements,
                COUNT(CASE WHEN dd.status = 'overdue' THEN 1 END) as overdue_disbursements
            FROM disbursement_schedules ds
            JOIN investordetails i ON ds.investor_id = i.id
            LEFT JOIN disbursement_detail dd ON ds.id = dd.schedule_id
            WHERE i.approval_status = 'approved'
            GROUP BY ds.id, i.id
            ORDER BY ds.created_at DESC
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('❌ Error fetching disbursement schedules:', error);
        res.status(500).json({ message: 'Failed to fetch disbursement schedules.' });
    }
};

/**
 * PUT: Update disbursement schedule with correct calculations
 */
exports.updateDisbursementSchedule = async (req, res) => {
    const { id } = req.params;
    
    try {
        console.log(`🔄 Updating disbursement schedule for investor ${id}...`);
        
        const updatedSchedule = await updateDisbursementSchedule(db, id);
        
        res.status(200).json({
            success: true,
            message: 'Disbursement schedule updated successfully with correct calculations.',
            data: updatedSchedule
        });
    } catch (error) {
        console.error('❌ Error updating disbursement schedule:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to update disbursement schedule.',
            error: error.message
        });
    }
};

/**
 * POST: Fix all disbursement schedules in database
 */
exports.fixAllDisbursementSchedules = async (req, res) => {
    try {
        console.log('🚀 Starting bulk fix of all disbursement schedules...');
        
        // Get all investors with disbursement schedules
        const query = `
            SELECT DISTINCT ds.investor_id, i.first_name, i.select_plan
            FROM disbursement_schedules ds
            JOIN investordetails i ON ds.investor_id = i.id
            ORDER BY ds.investor_id
        `;
        
        const { rows: investors } = await db.query(query);
        
        if (investors.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No investors with disbursement schedules found.',
                total_processed: 0
            });
        }
        
        let successCount = 0;
        let failureCount = 0;
        const results = [];
        
        for (const investor of investors) {
            try {
                console.log(`🔄 Processing investor ${investor.id}: ${investor.first_name}`);

                await updateDisbursementSchedule(db, investor.id);
                successCount++;

                results.push({
                    investor_id: investor.id,
                    name: investor.first_name,
                    select_plan: investor.select_plan,
                    status: 'success'
                });
                
            } catch (error) {
                failureCount++;
                console.error(`❌ Failed to update investor ${investor.id}:`, error.message);
                
                results.push({
                    investor_id: investor.id,
                    name: investor.first_name,
                    select_plan: investor.select_plan,
                    status: 'failed',
                    error: error.message
                });
            }
        }
        
        res.status(200).json({
            success: true,
            message: 'Bulk disbursement schedule fix completed.',
            summary: {
                total_investors: investors.length,
                successful: successCount,
                failed: failureCount,
                success_rate: `${((successCount / investors.length) * 100).toFixed(2)}%`
            },
            results: results
        });
        
    } catch (error) {
        console.error('❌ Error in bulk fix:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fix disbursement schedules.',
            error: error.message
        });
    }
};

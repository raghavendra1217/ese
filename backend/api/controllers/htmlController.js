// backend/api/controllers/htmlController.js

const db = require('../config/database');
const { getDisbursementSchedule, updateDisbursementSchedule } = require('../utils/disbursementCalculator');

/**
 * Generate investor report HTML
 */
exports.generateInvestorReport = async (req, res) => {
    const { id } = req.params;
    const { print } = req.query;
    
    try {
        console.log(`📄 Starting HTML generation for investor ${id}${print ? ' (print mode)' : ''}`);
        
        // Get investor data
        const investorQuery = 'SELECT * FROM investordetails WHERE id = $1';
        const { rows: investorRows } = await db.query(investorQuery, [id]);
        
        if (investorRows.length === 0) {
            console.log(`❌ Investor ${id} not found`);
            return res.status(404).json({ message: 'Investor not found.' });
        }
        
        const investor = investorRows[0];
        console.log(`📊 Investor data:`, {
            id: investor.id,
            name: investor.first_name,
            select_plan: investor.select_plan,
            plan_type: investor.plan_type,
            investment_date: investor.investment_date
        });
        
        // Get disbursement schedule
        console.log(`🔍 Fetching disbursement schedule for investor ${id}...`);
        let disbursementSchedule = await getDisbursementSchedule(db, id);
        
        // Debug: Log the disbursement schedule data
        console.log(`🔍 Disbursement schedule debug for investor ${id}:`, {
            hasSchedule: !!disbursementSchedule,
            scheduleType: typeof disbursementSchedule,
            scheduleKeys: disbursementSchedule ? Object.keys(disbursementSchedule) : 'null',
            hasDisbursements: !!(disbursementSchedule && disbursementSchedule.disbursements),
            disbursementsLength: disbursementSchedule?.disbursements?.length || 0,
            firstDisbursement: disbursementSchedule?.disbursements?.[0] || 'none',
            fullSchedule: disbursementSchedule
        });
        
        // Check if disbursement schedule has incorrect amounts and fix them
        if (disbursementSchedule && disbursementSchedule.disbursements && disbursementSchedule.disbursements.length > 0) {
            // Calculate expected investment amount based on select_plan
            let expectedInvestmentAmount;
            if (investor.select_plan === '5k') {
                expectedInvestmentAmount = 5000;
            } else if (investor.select_plan === '10k') {
                expectedInvestmentAmount = 10000;
            } else if (investor.select_plan === '50k') {
                expectedInvestmentAmount = 50000;
            } else if (investor.select_plan === '1 lakh') {
                expectedInvestmentAmount = 100000;
            } else if (investor.select_plan === '5 lakh') {
                expectedInvestmentAmount = 500000;
            } else {
                expectedInvestmentAmount = investor.select_plan; // Default fallback
            }
            
            const expectedTotalReturn = expectedInvestmentAmount * 1.2;
            const expectedDisbursementAmount = expectedTotalReturn / 4;
            
            // Check if the disbursement amounts are incorrect
            const firstDisbursement = disbursementSchedule.disbursements[0];
            const actualDisbursementAmount = parseFloat(firstDisbursement.disbursement_amount);
            
            console.log(`🔍 Checking disbursement amounts:`, {
                expectedDisbursementAmount,
                actualDisbursementAmount,
                needsUpdate: Math.abs(actualDisbursementAmount - expectedDisbursementAmount) > 1
            });
            
            // If disbursement amount is significantly different from expected, update the schedule
            if (Math.abs(actualDisbursementAmount - expectedDisbursementAmount) > 1) {
                console.log(`⚠️ Disbursement amounts are incorrect, updating schedule for investor ${id}...`);
                try {
                    disbursementSchedule = await updateDisbursementSchedule(db, id);
                    console.log(`✅ Updated disbursement schedule for investor ${id}`);
                } catch (error) {
                    console.error(`❌ Error updating disbursement schedule for investor ${id}:`, error);
                    // Continue with existing schedule if update fails
                }
            }
        }
        
        // If no disbursement schedule exists, create one for existing investors
        if (!disbursementSchedule) {
            console.log(`⚠️ No disbursement schedule found for investor ${id}, creating one...`);
            try {
                const { calculateDisbursementSchedule, createDisbursementSchedule } = require('../utils/disbursementCalculator');
                
                // Calculate investment amount based on select_plan
                let investmentAmount;
                if (investor.select_plan === '5k') {
                    investmentAmount = 5000;
                } else if (investor.select_plan === '10k') {
                    investmentAmount = 10000;
                } else if (investor.select_plan === '50k') {
                    investmentAmount = 50000;
                } else if (investor.select_plan === '1 lakh') {
                    investmentAmount = 100000;
                } else if (investor.select_plan === '5 lakh') {
                    investmentAmount = 500000;
                } else {
                    investmentAmount = 100000; // Default fallback
                }
                console.log(`💰 Investment amount calculated: ${investmentAmount}`);
                
                const scheduleData = calculateDisbursementSchedule({
                    investmentAmount,
                    selectPlan: investor.select_plan,
                    planType: investor.plan_type || '60 days',
                    investmentDate: investor.investment_date || new Date()
                });
                
                console.log(`📅 Schedule data calculated:`, scheduleData);
                await createDisbursementSchedule(db, scheduleData, id);
                disbursementSchedule = await getDisbursementSchedule(db, id);
                console.log(`✅ Created disbursement schedule for investor ${id}`);
            } catch (error) {
                console.error(`❌ Error creating disbursement schedule for investor ${id}:`, {
                    message: error.message,
                    stack: error.stack,
                    investorId: id,
                    investorData: investor
                });
                disbursementSchedule = null;
            }
        } else {
            console.log(`✅ Found existing disbursement schedule for investor ${id}`);
        }
        
        // Prepare data for HTML generation
        console.log(`📝 Preparing HTML data for investor ${id}...`);
        
        const investorName = investor.first_name;
        
        // Debug the select_plan value to understand why calculation is wrong
        console.log(`🔍 Investor select_plan debug:`, {
            investorId: id,
            select_plan: investor.select_plan,
            select_plan_type: typeof investor.select_plan,
            select_plan_length: investor.select_plan?.length,
            select_plan_raw: JSON.stringify(investor.select_plan),
            all_plan_fields: {
                select_plan: investor.select_plan,
                plan_type: investor.plan_type,
                no_of_months: null
            }
        });
        
        // More robust investment amount detection
        let investmentAmount;
        if (investor.select_plan === '5k') {
            investmentAmount = 5000;
        } else if (investor.select_plan === '10k') {
            investmentAmount = 10000;
        } else if (investor.select_plan === '50k') {
            investmentAmount = 50000;
        } else if (investor.select_plan === '1 lakh' || investor.select_plan === '1lakh' || investor.select_plan === '100000') {
            investmentAmount = 100000;
        } else if (investor.select_plan === '5 lakh' || investor.select_plan === '5lakh' || investor.select_plan === '500000') {
            investmentAmount = 500000;
        } else if (investor.select_plan === '10 lakh' || investor.select_plan === '10lakh' || investor.select_plan === '1000000') {
            investmentAmount = 1000000;
        } else {
            // Default to 1 lakh if unclear
            investmentAmount = 100000;
            console.log(`⚠️ Unknown select_plan value: "${investor.select_plan}", defaulting to 1 lakh`);
        }
        
        // Additional debug for investment amount calculation
        console.log(`💰 Investment amount calculation:`, {
            select_plan: investor.select_plan,
            calculated_investment_amount: investmentAmount,
            is_50k_plan: investor.select_plan === '50k',
            is_1lakh_plan: investor.select_plan !== '50k',
            expected_disbursement: investmentAmount * 1.2 / 4
        });
        
        const totalReturn = disbursementSchedule ? disbursementSchedule.schedule.total_return : investmentAmount * 1.2;
        const investmentId = investor.id; // Already in NG_0001 format
        
        // Format investment date properly
        let investmentDate = 'N/A';
        if (investor.investment_date) {
            try {
                const date = new Date(investor.investment_date);
                if (!isNaN(date.getTime())) {
                    const day = date.getDate().toString().padStart(2, '0');
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const year = date.getFullYear();
                    investmentDate = `${day}/${month}/${year}`;
                } else {
                    investmentDate = investor.investment_date; // Keep as is if can't parse
                }
            } catch (error) {
                investmentDate = investor.investment_date; // Keep as is if error
            }
        }
        
        // Prepare investor data
        const investorData = {
            "Investor Name": investorName,
            "Investment Scheme": `Rs ${investmentAmount}`,
            "Investment ID": investmentId,
            "Date Of Investment": investmentDate,
            "Mobile Number": investor.mobile_number,
            "PAN Card": investor.pan_card || 'N/A',
            "Account Number": investor.bank_account_number,
            "Bank Name": investor.bank_name,
            "Branch Name": investor.branch_name,
            "IFSC Code": investor.ifsc_code || 'N/A',
            "Address": investor.address,
            // Add these fields for conditional logic
            "select_plan": investor.select_plan,
            "plan_type": investor.plan_type
        };
        
        // Prepare table data
        const tableData = [];
        console.log(`🔍 Disbursement schedule data:`, {
            hasSchedule: !!disbursementSchedule,
            hasDisbursements: !!(disbursementSchedule && disbursementSchedule.disbursements),
            disbursementsCount: disbursementSchedule?.disbursements?.length || 0,
            scheduleData: disbursementSchedule
        });
        
        if (disbursementSchedule && disbursementSchedule.disbursements && disbursementSchedule.disbursements.length > 0) {
            console.log(`💰 HTML Calculation Debug:`, {
                investmentAmount,
                selectPlan: investor.select_plan,
                databaseDisbursementAmount: disbursementSchedule.disbursements[0]?.disbursement_amount,
                totalReturn: disbursementSchedule.schedule?.total_return,
                disbursementCount: disbursementSchedule.disbursements.length
            });
            
            disbursementSchedule.disbursements.forEach((disbursement, index) => {
                // Skip the final principle disbursement for special plans
                if ((investorData.select_plan === '50k' && investorData.plan_type === '180 days' && index === 12) ||
                    (investorData.select_plan === '50k' && investorData.plan_type === '240 days' && index === 16) ||
                    (investorData.select_plan === '1 lakh' && investorData.plan_type === '180 days' && index === 12) ||
                    (investorData.select_plan === '1 lakh' && investorData.plan_type === '240 days' && index === 16) ||
                    (investorData.select_plan === '5 lakh' && investorData.plan_type === '240 days' && index === 16) ||
                    (investorData.select_plan === '5 lakh' && investorData.plan_type === '360 days' && index === 24) ||
                    (investorData.select_plan === '10 lakh' && investorData.plan_type === '360 days' && index === 24)) {
                    console.log(`🔍 Skipping final principle disbursement for special plan: ${investorData.select_plan}/${investorData.plan_type}`);
                    return; // Skip this disbursement
                }

                // Debug: Log each disbursement data
                console.log(`🔍 Disbursement ${index + 1} debug:`, {
                    disbursementId: disbursement.id,
                    disbursementDate: disbursement.disbursement_date || disbursement.disbursementDate,
                    disbursementAmount: disbursement.disbursement_amount || disbursement.disbursementAmount,
                    status: disbursement.status,
                    fullDisbursement: disbursement
                });

                // Get the date and convert to dd/mm/yyyy format
                let disbursementDate = disbursement.disbursement_date || disbursement.disbursementDate || 'N/A';

                // If it's a Date object, convert to dd/mm/yyyy format
                if (disbursementDate instanceof Date) {
                    const day = disbursementDate.getDate().toString().padStart(2, '0');
                    const month = (disbursementDate.getMonth() + 1).toString().padStart(2, '0');
                    const year = disbursementDate.getFullYear();
                    disbursementDate = `${day}/${month}/${year}`;
                } else if (typeof disbursementDate === 'string' && disbursementDate !== 'N/A') {
                    // If it's a string, try to parse and format it
                    try {
                        const date = new Date(disbursementDate);
                        if (!isNaN(date.getTime())) {
                            const day = date.getDate().toString().padStart(2, '0');
                            const month = (date.getMonth() + 1).toString().padStart(2, '0');
                            const year = date.getFullYear();
                            disbursementDate = `${day}/${month}/${year}`;
                        }
                    } catch (error) {
                        // Keep original format if parsing fails
                    }
                }
                
                // Use the actual disbursement amount from the database
                const actualDisbursementAmount = parseFloat(disbursement.disbursement_amount || disbursement.disbursementAmount || 0);
                
                // Special handling for special plans
                if ((investorData.select_plan === '50k' && investorData.plan_type === '180 days') ||
                    (investorData.select_plan === '50k' && investorData.plan_type === '240 days') ||
                    (investorData.select_plan === '1 lakh' && investorData.plan_type === '180 days') ||
                    (investorData.select_plan === '1 lakh' && investorData.plan_type === '240 days') ||
                    (investorData.select_plan === '5 lakh' && investorData.plan_type === '240 days') ||
                    (investorData.select_plan === '5 lakh' && investorData.plan_type === '360 days') ||
                    (investorData.select_plan === '10 lakh' && investorData.plan_type === '360 days')) {
                    // For special plans: only show Date and Milk Profit (disbursement amount)
                    console.log(`📊 Special plan disbursement ${index + 1}:`, {
                        plan: `${investorData.select_plan}/${investorData.plan_type}`,
                        actualDisbursementAmount,
                        date: disbursementDate
                    });
                    
                    tableData.push([
                        `${index + 1}`,
                        disbursementDate,
                        `Rs ${actualDisbursementAmount.toFixed(2)}/-`
                    ]);
                } else {
                    // Regular plan handling with principle/profit split
                    // Use exact fractions to avoid rounding errors
                    // Principle: 5/6 of disbursement amount (83.333...%)
                    // Profit: 1/6 of disbursement amount (16.666...%)
                    const principleAmount = (actualDisbursementAmount * 5) / 6;
                    const profitAmount = actualDisbursementAmount / 6;
                    
                    console.log(`📊 Disbursement ${index + 1} calculation:`, {
                        actualDisbursementAmount,
                        principleAmount,
                        profitAmount,
                        total: principleAmount + profitAmount,
                        principlePercentage: (principleAmount / actualDisbursementAmount * 100).toFixed(2) + '%',
                        profitPercentage: (profitAmount / actualDisbursementAmount * 100).toFixed(2) + '%'
                    });
                    
                    tableData.push([
                        `${index + 1}`,
                        disbursementDate,
                        `Rs ${principleAmount.toFixed(2)}/-`,
                        `Rs ${profitAmount.toFixed(2)}/-`,
                        `Rs ${actualDisbursementAmount.toFixed(2)}/-`
                    ]);
                }
            });
        } else {
            // Fallback: Create sample table data if no disbursements exist
            console.log(`⚠️ No disbursements found, creating sample data for investor ${id}...`);
            console.log(`🔍 Why no disbursements:`, {
                hasSchedule: !!disbursementSchedule,
                scheduleType: typeof disbursementSchedule,
                hasDisbursements: !!(disbursementSchedule && disbursementSchedule.disbursements),
                disbursementsLength: disbursementSchedule?.disbursements?.length || 0,
                investorId: id,
                investorSelectPlan: investor.select_plan,
                investorPlanType: investor.plan_type
            });
            // Special handling for special plans fallback
            if ((investor.select_plan === '50k' && investor.plan_type === '180 days') ||
                (investor.select_plan === '50k' && investor.plan_type === '240 days') ||
                (investor.select_plan === '1 lakh' && investor.plan_type === '180 days') ||
                (investor.select_plan === '1 lakh' && investor.plan_type === '240 days') ||
                (investor.select_plan === '5 lakh' && investor.plan_type === '240 days') ||
                (investor.select_plan === '5 lakh' && investor.plan_type === '360 days') ||
                (investor.select_plan === '10 lakh' && investor.plan_type === '360 days')) {
                
                console.log(`🔍 Creating fallback disbursements for special plan:`, {
                    select_plan: investor.select_plan,
                    plan_type: investor.plan_type,
                    investment_date: investor.investment_date,
                    investment_date_type: typeof investor.investment_date
                });
                
                let sampleAmount, numDisbursements;
                if (investor.select_plan === '50k' && investor.plan_type === '180 days') {
                    sampleAmount = 2500; // 2.5k per disbursement for 50k/180d plan
                    numDisbursements = 12;
                } else if (investor.select_plan === '50k' && investor.plan_type === '240 days') {
                    sampleAmount = 2500; // 2.5k per disbursement for 50k/240d plan
                    numDisbursements = 16;
                } else if (investor.select_plan === '1 lakh' && investor.plan_type === '180 days') {
                    sampleAmount = 5000; // 5k per disbursement for 1L/180d plan
                    numDisbursements = 12;
                } else if (investor.select_plan === '1 lakh' && investor.plan_type === '240 days') {
                    sampleAmount = 5000; // 5k per disbursement for 1L/240d plan
                    numDisbursements = 16;
                } else if (investor.select_plan === '5 lakh' && investor.plan_type === '240 days') {
                    sampleAmount = 25000; // 25k per disbursement for 5L/240d plan
                    numDisbursements = 16;
                } else if (investor.select_plan === '5 lakh' && investor.plan_type === '360 days') {
                    sampleAmount = 25000; // 25k per disbursement for 5L/360d plan
                    numDisbursements = 24;
                } else if (investor.select_plan === '10 lakh' && investor.plan_type === '360 days') {
                    sampleAmount = 50000; // 50k per disbursement for 10L/360d plan
                    numDisbursements = 24;
                }
                
                for (let i = 0; i < numDisbursements; i++) {
                    const date = new Date(investor.investment_date);
                    
                    // Check if date is valid
                    if (isNaN(date.getTime())) {
                        console.error(`❌ Invalid investment date: ${investor.investment_date}`);
                        tableData.push([
                            `${i + 1}`,
                            'Invalid Date',
                            `Rs ${sampleAmount.toFixed(2)}/-`
                        ]);
                        continue;
                    }
                    
                    date.setDate(date.getDate() + (i + 1) * 15); // Every 15 days
                    
                    const day = date.getDate().toString().padStart(2, '0');
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const year = date.getFullYear();
                    const disbursementDate = `${day}/${month}/${year}`;
                    
                    tableData.push([
                        `${i + 1}`,
                        disbursementDate,
                        `Rs ${sampleAmount.toFixed(2)}/-`
                    ]);
                }
            } else {
                // Regular plan fallback
                const totalReturn = investmentAmount * 1.2; // 20% profit
                const sampleAmount = totalReturn / 4; // 4 disbursements of total return
                // Use exact fractions to avoid rounding errors
                const principleAmount = (sampleAmount * 5) / 6; // 5/6 = 83.333...%
                const profitAmount = sampleAmount / 6; // 1/6 = 16.666...%
                
                for (let i = 0; i < 4; i++) {
                    const date = new Date(investor.investment_date);
                    
                    // Check if date is valid
                    if (isNaN(date.getTime())) {
                        console.error(`❌ Invalid investment date: ${investor.investment_date}`);
                        continue;
                    }
                    
                    date.setDate(date.getDate() + (i + 1) * 15); // Every 15 days
                    
                    // Format date as dd/mm/yyyy
                    const day = date.getDate().toString().padStart(2, '0');
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const year = date.getFullYear();
                    const disbursementDate = `${day}/${month}/${year}`;
                    
                    tableData.push([
                        `${i + 1}`,
                        disbursementDate,
                        `Rs ${principleAmount.toFixed(2)}/-`,
                        `Rs ${profitAmount.toFixed(2)}/-`,
                        `Rs ${sampleAmount.toFixed(2)}/-`
                    ]);
                }
            }
        }
        
        console.log(`📋 HTML data prepared:`, {
            investorName: investorName,
            investmentAmount: investmentAmount,
            disbursementCount: tableData.length,
            hasDisbursementSchedule: !!disbursementSchedule
        });
        
        // Generate HTML content with special flag for special plans
        const isSpecialPlan = (investor.select_plan === '50k' && investor.plan_type === '180 days') ||
                              (investor.select_plan === '50k' && investor.plan_type === '240 days') ||
                              (investor.select_plan === '1 lakh' && investor.plan_type === '180 days') ||
                              (investor.select_plan === '1 lakh' && investor.plan_type === '240 days') ||
                              (investor.select_plan === '5 lakh' && investor.plan_type === '240 days') ||
                              (investor.select_plan === '5 lakh' && investor.plan_type === '360 days') ||
                              (investor.select_plan === '10 lakh' && investor.plan_type === '360 days');
        const htmlContent = generateHTMLContent(investorData, tableData, print, isSpecialPlan);
        
        // Set response headers for HTML
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `inline; filename="NG_Investment_Summary_${investorName.replace(/\s+/g, '_')}_${investmentId}.html"`);
        
        // Send HTML response
        res.send(htmlContent);
        console.log(`✅ HTML generated successfully for investor ${id}`);
        
    } catch (error) {
        console.error(`❌ Error generating HTML report for investor ${id}:`, {
            message: error.message,
            stack: error.stack,
            investorId: id
        });
        res.status(500).json({ message: 'Failed to generate HTML report.' });
    }
};

/**
 * Generate HTML content for investor report
 */
function generateHTMLContent(investorData, tableData, printMode = false, isSpecialPlan = false) {
    // Helper functions to build HTML parts
    const buildInvestorDetails = (data) => {
        let rows = "";
        for (const [key, value] of Object.entries(data)) {
            const valueClass = key === "Investor Name" || key === "Investment Scheme" ? "orange-text" : "";
            rows += `<div class="detail-row"><div class="detail-key">${key}</div><div class="detail-value ${valueClass}">: ${value}</div></div>`;
        }
        return rows;
    };

    const buildTableRows = (data) => {
        let rows = "";
        for (const rowData of data) {
            rows += "<tr>" + rowData.map(cell => `<td>${cell}</td>`).join("") + "</tr>";
        }
        return rows;
    };

    // HTML and CSS Template
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>NG Investment Summary</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 0; 
                background-color: #fff; 
                color: #34495e; 
                -webkit-print-color-adjust: exact; 
            }
            .container { 
                max-width: 210mm; 
                min-height: 297mm; 
                margin: 0 auto; 
                padding: 20mm; 
                position: relative; 
                border: 1px solid #eee; 
                box-sizing: border-box;
            }
            
            /* A4 Print Styles */
            @media print {
                body {
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: none;
                    margin: 0;
                    padding: 20mm;
                    border: none;
                    box-shadow: none;
                }
                @page {
                    size: A4;
                    margin: 20mm;
                }
            }
            
            /* Mobile Responsive Styles */
            @media screen and (max-width: 768px) {
                .container { 
                    margin: 10px; 
                    padding: 20px; 
                    max-width: none; 
                    min-height: auto;
                }
                .header h1 { 
                    font-size: 20px; 
                }
                .header p { 
                    font-size: 12px; 
                }
                .details-grid { 
                    font-size: 12px; 
                }
                .detail-key { 
                    width: 140px; 
                }
                .investment-table { 
                    font-size: 11px; 
                }
                .investment-table th, .investment-table td { 
                    padding: 6px 4px; 
                }
                .notes-section { 
                    font-size: 11px; 
                }
            }
            
            @media screen and (max-width: 480px) {
                .container { 
                    margin: 5px; 
                    padding: 15px; 
                    min-height: auto;
                }
                .header h1 { 
                    font-size: 18px; 
                }
                .header img { 
                    width: 60px; 
                    height: 60px; 
                }
                .details-grid { 
                    font-size: 11px; 
                }
                .detail-key { 
                    width: 120px; 
                }
                .investment-table { 
                    font-size: 10px; 
                }
                .investment-table th, .investment-table td { 
                    padding: 4px 2px; 
                }
                .notes-section { 
                    font-size: 10px; 
                }
            }
            .container::before { 
                content: ''; 
                position: absolute; 
                top: 50%; 
                left: 50%; 
                transform: translate(-50%, -50%); 
                width: 250px; 
                height: 250px; 
                background-image: url('/logo_ng.png'); 
                background-size: contain; 
                background-repeat: no-repeat; 
                opacity: 0.08; 
                z-index: -1; 
            }
            .header { 
                text-align: center; 
                margin-bottom: 40px; 
            }
            .header img { 
                width: 80px; 
                height: 80px; 
            }
            .header h1 { 
                color: #0f8b89; 
                font-size: 24px; 
                margin: 10px 0 5px 0; 
            }
            .header p { 
                margin: 0; 
                font-size: 14px; 
            }
            .section-title { 
                display: inline-block; 
                background-color: #e0f2f1; 
                color: #0f8b89; 
                padding: 5px 10px; 
                font-size: 16px; 
                font-weight: bold; 
                margin-bottom: 20px; 
            }
            .details-grid { 
                display: grid; 
                grid-template-columns: 1fr; 
                gap: 8px; 
                margin-bottom: 40px; 
                font-size: 13px; 
            }
            .detail-row { 
                display: flex; 
            }
            .detail-key { 
                width: 170px; 
                font-weight: bold; 
            }
            .detail-value { 
                flex: 1; 
            }
            .orange-text { 
                color: #FF8C00 !important; 
                font-weight: bold; 
            }
            .investment-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 40px; 
                font-size: 13px; 
            }
            .investment-table th, .investment-table td { 
                text-align: center; 
                padding: 10px; 
            }
            .investment-table thead th { 
                color: #FF8C00; 
                font-weight: bold; 
                border-bottom: 1.5px solid #000; 
            }
            .investment-table tbody td { 
                border-bottom: 0.5px solid #ccc; 
            }
            .investment-table tbody tr:last-child td { 
                border-bottom: none; 
            }
            .notes-section h3 { 
                font-size: 14px; 
                margin-bottom: 10px; 
                color: #000; 
            }
            .notes-section ul { 
                list-style-type: none; 
                padding-left: 0; 
                margin: 0; 
                font-size: 12px; 
                color: #555555; 
            }
            .notes-section li { 
                margin-bottom: 10px; 
                line-height: 1.5; 
            }
        </style>
    </head>
    <body${printMode ? ' onload="window.print()"' : ''}>
        <div class="container">
            <div class="header">
                <img src="/logo_ng.png" alt="Logo">
                <h1>NG info solutions Pvt. Ltd</h1>
                <p>Milk & Dairy Farms. Investments</p>
                <p style="font-weight: bold;">Mobile Number: 7075323265</p>
            </div>
            <div class="section-title">Investor Details</div>
            <div class="details-grid">${buildInvestorDetails(investorData)}</div>
            <table class="investment-table">
                <thead>
                    <tr>
                        <th>Week</th>
                        <th>Date</th>
                        ${isSpecialPlan ? 
                            '<th>Milk Profit</th>' : 
                            '<th>Principle Invest</th><th>Milk Profit</th><th>Net Profit</th>'
                        }
                    </tr>
                </thead>
                <tbody>${buildTableRows(tableData)}</tbody>
            </table>
            <div class="notes-section">
                <h3>Notes:</h3>
                <ul>
                    <li>1. The amount will be credited to your registered bank account, and no modifications can be made once the transaction has been initiated.</li>
                    <li>2. If you do not receive the funds by the disbursement date, kindly notify us within three days. Requests submitted after this period cannot be processed.</li>
                    <li>3. We are unable to disclose any investor details except to the agent associated with that specific investor.</li>
                    <li>4. If you request a refund on the transaction day before your ID is approved, an 18% GST will be deducted, and the remaining amount will be sent to you within three working days. Once approved, it adds to the investments.</li>
                    ${investorData.select_plan === '50k' && investorData.plan_type === '180 days' ? `
                    <li>5. The principal amount of ₹50,000 will be disbursed only upon the user's request, and only after all previously scheduled disbursements have been completed.</li>
                    <li>6. The principal amount of ₹50,000 will be released within one working day of the user's request, provided that at least 180 days have elapsed.</li>
                    ` : ''}
                    ${investorData.select_plan === '50k' && investorData.plan_type === '240 days' ? `
                    <li>5. The principal amount of ₹50,000 will be disbursed only upon the user's request, and only after all previously scheduled disbursements have been completed.</li>
                    <li>6. The principal amount of ₹50,000 will be released within one working day of the user's request, provided that at least 240 days have elapsed.</li>
                    ` : ''}
                    ${investorData.select_plan === '1 lakh' && investorData.plan_type === '180 days' ? `
                    <li>5. The principal amount of ₹1,00,000 will be disbursed only upon the user's request, and only after all previously scheduled disbursements have been completed.</li>
                    <li>6. The principal amount of ₹1,00,000 will be released within one working day of the user's request, provided that at least 180 days have elapsed.</li>
                    ` : ''}
                    ${investorData.select_plan === '1 lakh' && investorData.plan_type === '240 days' ? `
                    <li>5. The principal amount of ₹1,00,000 will be disbursed only upon the user's request, and only after all previously scheduled disbursements have been completed.</li>
                    <li>6. The principal amount of ₹1,00,000 will be released within one working day of the user's request, provided that at least 240 days have elapsed.</li>
                    ` : ''}
                    ${investorData.select_plan === '5 lakh' && investorData.plan_type === '240 days' ? `
                    <li>5. The principal amount of ₹5,00,000 will be disbursed only upon the user's request, and only after all previously scheduled disbursements have been completed.</li>
                    <li>6. The principal amount of ₹5,00,000 will be released within one working day of the user's request, provided that at least 240 days have elapsed.</li>
                    ` : ''}
                    ${investorData.select_plan === '5 lakh' && investorData.plan_type === '360 days' ? `
                    <li>5. The principal amount of ₹5,00,000 will be disbursed only upon the user's request, and only after all previously scheduled disbursements have been completed.</li>
                    <li>6. The principal amount of ₹5,00,000 will be released within one working day of the user's request, provided that at least 360 days have elapsed.</li>
                    ` : ''}
                    ${investorData.select_plan === '10 lakh' && investorData.plan_type === '360 days' ? `
                    <li>5. The principal amount of ₹10,00,000 will be disbursed only upon the user's request, and only after all previously scheduled disbursements have been completed.</li>
                    <li>6. The principal amount of ₹10,00,000 will be released within one working day of the user's request, provided that at least 360 days have elapsed.</li>
                    ` : ''}
                </ul>
            </div>
        </div>
        
    </body>
    </html>
    `;
}

/**
 * Generate payslip HTML
 */
exports.generatePayslipReport = async (req, res) => {
    const { id } = req.params;
    const { print } = req.query;
    
    try {
        console.log(`📄 Starting payslip HTML generation for payslip ${id}${print ? ' (print mode)' : ''}`);
        
        // Get payslip data
        const payslipQuery = 'SELECT * FROM payslips WHERE id = $1';
        const { rows: payslipRows } = await db.query(payslipQuery, [id]);
        
        if (payslipRows.length === 0) {
            console.log(`❌ Payslip ${id} not found`);
            return res.status(404).json({ message: 'Payslip not found.' });
        }
        
        const payslip = payslipRows[0];
        console.log(`📊 Payslip data:`, {
            id: payslip.id,
            employee_name: payslip.employee_name,
            employee_id: payslip.employee_id,
            month: payslip.month,
            year: payslip.year
        });
        
        // Generate HTML content
        const htmlContent = generatePayslipHTMLContent(payslip, print);
        
        // Set response headers for HTML
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `inline; filename="Payslip_${payslip.employee_name.replace(/\s+/g, '_')}_${payslip.month}_${payslip.year}.html"`);
        
        // Send HTML response
        res.send(htmlContent);
        console.log(`✅ Payslip HTML generated successfully for payslip ${id}`);
        
    } catch (error) {
        console.error(`❌ Error generating payslip HTML for payslip ${id}:`, {
            message: error.message,
            stack: error.stack,
            payslipId: id
        });
        res.status(500).json({ message: 'Failed to generate payslip HTML.' });
    }
};

/**
 * Generate HTML content for payslip
 */
function generatePayslipHTMLContent(payslip, printMode = false) {
    // Calculate values
    const grossSalary = parseFloat(payslip.basic_salary) + parseFloat(payslip.total_addition);
    const netSalary = grossSalary - parseFloat(payslip.total_deductions);
    
    // Convert number to words
    const numberToWords = (num) => {
        const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
        const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
        const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
        
        if (num === 0) return 'ZERO';
        if (num < 10) return ones[num];
        if (num < 20) return teens[num - 10];
        if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
        if (num < 1000) return ones[Math.floor(num / 100)] + ' HUNDRED' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
        if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' THOUSAND' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
        if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' LAKH' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
        return numberToWords(Math.floor(num / 10000000)) + ' CRORE' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '');
    };
    
    const salaryInWords = numberToWords(Math.floor(netSalary)) + ' RUPEES ONLY';
    
    // Format currency
    const formatCurrency = (amount) => {
        return parseFloat(amount).toLocaleString('en-IN');
    };
    
    // Get payment method display
    const getPaymentMethodDisplay = (method) => {
        switch(method) {
            case 'cash': return 'Cash';
            case 'cheque': return 'Cheque';
            case 'net_banking': return 'Net Banking/Other Transactions';
            default: return method;
        }
    };
    
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Salary Slip</title>
        <style>
            /* A4 Page Styles */
            body {
                background-color: #f0f0f0;
                margin: 0;
                padding: 0;
                font-family: 'Arial', sans-serif;
                font-size: 10pt; /* Standard document font size */
            }

            .page {
                background: white;
                width: 210mm;
                min-height: 297mm;
                display: block;
                margin: 20mm auto;
                padding: 15mm;
                box-shadow: 0 0 0.5cm rgba(0,0,0,0.5);
                box-sizing: border-box;
            }

            /* General Styles */
            table {
                width: 100%;
                border-collapse: collapse;
            }

            td, th {
                padding: 8px 10px;
                border: 1px solid #000000;
                vertical-align: top;
            }

            /* Header Section */
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                padding-bottom: 10px;
                border-bottom: 2px solid #000000;
                margin-bottom: 5px;
            }

            .company-details {
                max-width: 85%;
            }

            .company-name {
                color: #d9534f; /* A shade of red-orange */
                font-size: 21.85pt;
                font-weight: bold;
                margin: 0;
                padding: 15px 0 5px 0;
            }

            .company-address {
                font-size: 9.83pt;
                margin: 0;
                color: #febb31;
                font-weight: bold;
                padding: 5px 0 15px 0;
            }
            
            .logo-container {
                width: 85.8px;
                height: 85.8px;
            }

            .logo-container img {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }

            .slip-title-container {
                text-align: center;
                margin: 10px 0 20px 0;
            }

            .slip-title {
                display: inline-block;
                font-size: 14pt;
                font-weight: bold;
                color: #0056b3; /* A shade of blue */
                padding: 0 15px 3px 15px;
                border-bottom: 2px solid #0056b3;
            }

            /* Employee Info Table */
            .employee-info {
                margin-bottom: 20px;
                border: 2px solid #000;
            }

            .employee-info td:nth-child(1),
            .employee-info td:nth-child(3) {
                font-weight: bold;
                width: 18%;
            }
            
            .employee-info td:nth-child(2),
            .employee-info td:nth-child(4) {
                width: 32%;
            }

            /* Earnings & Deductions Table */
            .main-table {
                border: 2px solid #000;
            }
            
            .main-table th {
                text-align: left;
                font-weight: bold;
                background-color: #f2f2f2;
            }
            
            /* Removes padding from the cells holding the inner tables */
            .main-table > tbody > tr > td {
                padding: 0;
            }

            /* Reduces padding and removes borders for inner table cells */
            .main-table table td {
                padding: 6px 10px;
                border: none;
            }

            .main-table table td:first-child {
                width: 70%;
            }
            .main-table table td:last-child {
                width: 30%;
                text-align: right;
            }

            .earnings-col, .deductions-col {
                width: 50%;
                display: inline-block;
                box-sizing: border-box;
            }
            
            .earnings-col td:first-child, .deductions-col td:first-child {
                width: 70%;
            }
            .earnings-col td:last-child, .deductions-col td:last-child {
                width: 30%;
                text-align: right;
            }

            /* Footer Section */
            .net-salary-section {
                 border: 2px solid #000;
                 border-top: none;
                 font-weight: bold;
            }
            
            .net-salary-section td:first-child {
                width: 30%;
            }

            .net-salary-section td:last-child {
                text-align: right;
            }

            .payment-info {
                margin-top: 30px;
                font-size: 11pt;
            }

            .payment-info span {
                margin-right: 20px;
            }
            
            .payment-info input {
                margin-right: 5px;
                pointer-events: none; /* Make checkboxes non-clickable */
            }
            
            /* Utility */
            .bold {
                font-weight: bold;
            }
            
            @media print {
                body, .page {
                    margin: 0;
                    box-shadow: none;
                }
                @page {
                    size: A4;
                    margin: 20mm;
                }
            }
        </style>
    </head>
    <body${printMode ? ' onload="window.print()"' : ''}>
        <div class="page">
            <!-- Header: Company Name, Address, and Logo -->
            <div class="header">
                <div class="company-details">
                    <p class="company-name">Narayana Gayathri info Solutions Pvt Ltd</p>
                    <p class="company-address">1-1-189/19/1, Vivek Nagar Near Pendaganti Law College Chikkadpally Hyderabad-500020</p>
                </div>
                <div class="logo-container">
                    <img src="/logo_ng.png" alt="NG Solutions Logo">
                </div>
            </div>

            <!-- Title: Salary Slip -->
            <div class="slip-title-container">
                <span class="slip-title">Salary Slip</span>
            </div>

            <!-- Employee Information Table -->
            <table class="employee-info">
                <tbody>
                    <tr>
                        <td>Employee Id</td>
                        <td>${payslip.employee_id}</td>
                        <td>Employee Name</td>
                        <td>${payslip.employee_name}</td>
                    </tr>
                    <tr>
                        <td>Designation</td>
                        <td>${payslip.designation}</td>
                        <td>Month/Year</td>
                        <td>${payslip.month}-${payslip.year}</td>
                    </tr>
                    <tr>
                        <td>Basic salary</td>
                        <td>${formatCurrency(payslip.basic_salary)}</td>
                        <td>Total working days</td>
                        <td>${payslip.total_working_days}</td>
                    </tr>
                </tbody>
            </table>

            <!-- Earnings and Deductions Table -->
            <table class="main-table">
                <thead>
                    <tr>
                        <th>Earnings</th>
                        <th>Deductions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <table>
                                <tbody>
                                    <tr><td>Employee worked days</td><td>${payslip.total_working_days}</td></tr>
                                    <tr><td>No of Working Days Salary</td><td>${formatCurrency(payslip.basic_salary)}</td></tr>
                                    <tr><td>DA</td><td>${formatCurrency(payslip.da)}</td></tr>
                                    <tr><td>HRA</td><td>${formatCurrency(payslip.hra)}</td></tr>
                                    <tr><td>TA</td><td>${formatCurrency(payslip.ta)}</td></tr>
                                    <tr class="bold"><td>Total Addition</td><td>${formatCurrency(payslip.total_addition)}</td></tr>
                                </tbody>
                            </table>
                        </td>
                        <td>
                            <table>
                                <tbody>
                                    <tr><td>Provident Fund</td><td>${formatCurrency(payslip.provident_fund)}</td></tr>
                                    <tr><td>ESI</td><td>${formatCurrency(payslip.esi)}</td></tr>
                                    <tr><td>Professional Tax</td><td>${formatCurrency(payslip.professional_tax)}</td></tr>
                                    <tr><td>Other Deductions</td><td>${formatCurrency(payslip.other_deductions)}</td></tr>
                                    <tr><td style="color:white;">.</td><td></td></tr> <!-- Spacer -->
                                    <tr class="bold"><td>Total Deductions</td><td>${formatCurrency(payslip.total_deductions)}</td></tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <!-- Net Salary Section -->
             <table class="net-salary-section">
                <tbody>
                    <tr>
                        <td>Net salary</td>
                        <td>${formatCurrency(netSalary)}.00</td>
                    </tr>
                    <tr>
                        <td>Salary In Words</td>
                        <td>${salaryInWords}</td>
                    </tr>
                </tbody>
            </table>

            <!-- Payment Method Footer -->
            <div class="payment-info">
                <strong>Salary Paid By:</strong>
                <span><input type="checkbox" ${payslip.salary_paid_by === 'cash' ? 'checked' : ''}> <label>Cash</label></span>
                <span><input type="checkbox" ${payslip.salary_paid_by === 'cheque' ? 'checked' : ''}> <label>Cheque</label></span>
                <span><input type="checkbox" ${payslip.salary_paid_by === 'net_banking' ? 'checked' : ''}> <label>Net Banking/Other Transactions</label></span>
            </div>
        </div>
    </body>
    </html>
    `;
}
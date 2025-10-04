// Utility functions for calculating disbursement schedules

/**
 * Calculate disbursement schedule for an investment
 * @param {Object} params - Investment parameters
 * @param {number} params.investmentAmount - Original investment amount
 * @param {string} params.selectPlan - Selected plan (10k, 50k, or 1 lakh)
 * @param {string} params.planType - Plan type (30 days, 60 days, 120 days)
 * @param {Date} params.investmentDate - Investment start date
 * @returns {Object} Disbursement schedule details
 */
function calculateDisbursementSchedule({ investmentAmount, selectPlan, planType, investmentDate }) {
    console.log(`🔢 Calculating disbursement schedule:`, {
        investmentAmount,
        selectPlan,
        planType,
        investmentDate
    });

    // Define plan configurations
    const planConfigs = {
        // 30 days plans
        '30 days': {
            '10k': {
                investment: 10000,
                profit: 1500,
                totalReturn: 11500,
                durationDays: 30,
                intervalDays: 15,
                numDisbursements: 2
            }
        },
        // 32 days plans
        '32 days': {
            '5k': {
                investment: 5000,
                profit: 1000,
                totalReturn: 6000,
                durationDays: 32,
                intervalDays: 8,
                numDisbursements: 4
            }
        },
        // 60 days plans
        '60 days': {
            '50k': {
                investment: 50000,
                profit: 10000,
                totalReturn: 60000,
                durationDays: 60,
                intervalDays: 15,
                numDisbursements: 4
            },
            '1 lakh': {
                investment: 100000,
                profit: 20000,
                totalReturn: 120000,
                durationDays: 60,
                intervalDays: 15,
                numDisbursements: 4
            }
        },
        // 120 days plans
        '120 days': {
            '50k': {
                investment: 50000,
                profit: 18000,
                totalReturn: 68000,
                durationDays: 120,
                intervalDays: 15,
                numDisbursements: 8
            },
            '1 lakh': {
                investment: 100000,
                profit: 38000,
                totalReturn: 138000,
                durationDays: 120,
                intervalDays: 15,
                numDisbursements: 8
            }
        },
        // 180 days plans
        '180 days': {
            '50k': {
                investment: 50000,
                profit: 30000,
                totalReturn: 80000,
                durationDays: 180,
                intervalDays: 15,
                numDisbursements: 13,
                specialPlan: true // Flag for special handling
            },
            '1 lakh': {
                investment: 100000,
                profit: 60000,
                totalReturn: 160000,
                durationDays: 180,
                intervalDays: 15,
                numDisbursements: 13,
                specialPlan: true // Flag for special handling
            }
        },
        // 240 days plans
        '240 days': {
            '50k': {
                investment: 50000,
                profit: 40000,
                totalReturn: 90000,
                durationDays: 240,
                intervalDays: 15,
                numDisbursements: 17,
                specialPlan: true // Flag for special handling
            },
            '1 lakh': {
                investment: 100000,
                profit: 80000,
                totalReturn: 180000,
                durationDays: 240,
                intervalDays: 15,
                numDisbursements: 17,
                specialPlan: true // Flag for special handling
            },
            '5 lakh': {
                investment: 500000,
                profit: 400000,
                totalReturn: 900000,
                durationDays: 240,
                intervalDays: 15,
                numDisbursements: 17,
                specialPlan: true // Flag for special handling
            }
        }
    };

    // Get plan configuration
    const planConfig = planConfigs[planType]?.[selectPlan];
    
    if (!planConfig) {
        throw new Error(`Invalid plan combination: ${selectPlan} with ${planType}`);
    }

    const { totalReturn, durationDays, intervalDays, numDisbursements, specialPlan } = planConfig;
    
    // Special handling for special plans
    let disbursementAmount;
    if (specialPlan) {
        if (selectPlan === '50k' && planType === '180 days') {
            disbursementAmount = 2500; // First 12 disbursements are 2.5k each
        } else if (selectPlan === '50k' && planType === '240 days') {
            disbursementAmount = 2500; // First 16 disbursements are 2.5k each
        } else if (selectPlan === '1 lakh' && planType === '180 days') {
            disbursementAmount = 5000; // First 12 disbursements are 5k each
        } else if (selectPlan === '1 lakh' && planType === '240 days') {
            disbursementAmount = 5000; // First 16 disbursements are 5k each
        } else if (selectPlan === '5 lakh' && planType === '240 days') {
            disbursementAmount = 25000; // First 16 disbursements are 25k each
        } else {
            disbursementAmount = totalReturn / numDisbursements;
        }
    } else {
        disbursementAmount = totalReturn / numDisbursements;
    }

    console.log(`💰 Return calculation:`, {
        planConfig,
        totalReturn,
        disbursementAmount,
        investmentAmount
    });

    console.log(`📅 Disbursement calculation:`, {
        durationDays,
        intervalDays,
        numDisbursements,
        disbursementAmount,
        totalReturn
    });

    // Generate disbursement dates
    const disbursementDates = [];
    const startDate = new Date(investmentDate);

    for (let i = 1; i <= numDisbursements; i++) {
        const disbursementDate = new Date(startDate);
        
        // Special handling for special plans
        if (specialPlan) {
            if (selectPlan === '50k' && planType === '180 days') {
                if (i <= 12) {
                    // First 12 disbursements: every 15 days, 2.5k each
                    disbursementDate.setDate(startDate.getDate() + (i * intervalDays));
                    disbursementDates.push({
                        disbursementNumber: i,
                        disbursementDate: disbursementDate.toISOString().split('T')[0],
                        disbursementAmount: 2500
                    });
                } else if (i === 13) {
                    // 13th disbursement: 181st day, 50k (principle)
                    disbursementDate.setDate(startDate.getDate() + 181);
                    disbursementDates.push({
                        disbursementNumber: i,
                        disbursementDate: disbursementDate.toISOString().split('T')[0],
                        disbursementAmount: 50000,
                        isPrincipleAmount: true
                    });
                }
            } else if (selectPlan === '50k' && planType === '240 days') {
                if (i <= 16) {
                    // First 16 disbursements: every 15 days, 2.5k each
                    disbursementDate.setDate(startDate.getDate() + (i * intervalDays));
                    disbursementDates.push({
                        disbursementNumber: i,
                        disbursementDate: disbursementDate.toISOString().split('T')[0],
                        disbursementAmount: 2500
                    });
                } else if (i === 17) {
                    // 17th disbursement: 241st day, 50k (principle)
                    disbursementDate.setDate(startDate.getDate() + 241);
                    disbursementDates.push({
                        disbursementNumber: i,
                        disbursementDate: disbursementDate.toISOString().split('T')[0],
                        disbursementAmount: 50000,
                        isPrincipleAmount: true
                    });
                }
            } else if (selectPlan === '1 lakh' && planType === '180 days') {
                if (i <= 12) {
                    // First 12 disbursements: every 15 days, 5k each
                    disbursementDate.setDate(startDate.getDate() + (i * intervalDays));
                    disbursementDates.push({
                        disbursementNumber: i,
                        disbursementDate: disbursementDate.toISOString().split('T')[0],
                        disbursementAmount: 5000
                    });
                } else if (i === 13) {
                    // 13th disbursement: 181st day, 1 lakh (principle)
                    disbursementDate.setDate(startDate.getDate() + 181);
                    disbursementDates.push({
                        disbursementNumber: i,
                        disbursementDate: disbursementDate.toISOString().split('T')[0],
                        disbursementAmount: 100000,
                        isPrincipleAmount: true
                    });
                }
            } else if (selectPlan === '1 lakh' && planType === '240 days') {
                if (i <= 16) {
                    // First 16 disbursements: every 15 days, 5k each
                    disbursementDate.setDate(startDate.getDate() + (i * intervalDays));
                    disbursementDates.push({
                        disbursementNumber: i,
                        disbursementDate: disbursementDate.toISOString().split('T')[0],
                        disbursementAmount: 5000
                    });
                } else if (i === 17) {
                    // 17th disbursement: 241st day, 1 lakh (principle)
                    disbursementDate.setDate(startDate.getDate() + 241);
                    disbursementDates.push({
                        disbursementNumber: i,
                        disbursementDate: disbursementDate.toISOString().split('T')[0],
                        disbursementAmount: 100000,
                        isPrincipleAmount: true
                    });
                }
            } else if (selectPlan === '5 lakh' && planType === '240 days') {
                if (i <= 16) {
                    // First 16 disbursements: every 15 days, 25k each
                    disbursementDate.setDate(startDate.getDate() + (i * intervalDays));
                    disbursementDates.push({
                        disbursementNumber: i,
                        disbursementDate: disbursementDate.toISOString().split('T')[0],
                        disbursementAmount: 25000
                    });
                } else if (i === 17) {
                    // 17th disbursement: 241st day, 5 lakh (principle)
                    disbursementDate.setDate(startDate.getDate() + 241);
                    disbursementDates.push({
                        disbursementNumber: i,
                        disbursementDate: disbursementDate.toISOString().split('T')[0],
                        disbursementAmount: 500000,
                        isPrincipleAmount: true
                    });
                }
            }
        } else {
            // Regular plan handling
            disbursementDate.setDate(startDate.getDate() + (i * intervalDays));
            disbursementDates.push({
                disbursementNumber: i,
                disbursementDate: disbursementDate.toISOString().split('T')[0],
                disbursementAmount: disbursementAmount
            });
        }
    }

    return {
        investmentAmount,
        totalReturn,
        durationDays,
        intervalDays,
        numDisbursements,
        disbursementAmount,
        disbursementDates,
        investmentDate: new Date(investmentDate).toISOString().split('T')[0]
    };
}

/**
 * Create disbursement schedule in database
 * @param {Object} db - Database connection
 * @param {Object} scheduleData - Schedule data from calculateDisbursementSchedule
 * @param {number} investorId - Investor ID
 * @returns {Object} Created schedule with ID
 */
async function createDisbursementSchedule(dbOrClient, scheduleData, investorId) {
    // Check if dbOrClient is already a client connection or needs to create one
    const client = dbOrClient.query ? dbOrClient : await dbOrClient.connect();
    const shouldCommit = !dbOrClient.query; // Only commit if we created our own connection
    
    try {
        if (shouldCommit) {
            await client.query('BEGIN');
        }

        // Insert disbursement schedule
        const scheduleQuery = `
            INSERT INTO disbursement_schedules (
                investor_id, investment_amount, total_return, duration_days,
                interval_days, num_disbursements, disbursement_amount, investment_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;

        const scheduleParams = [
            investorId,
            scheduleData.investmentAmount,
            scheduleData.totalReturn,
            scheduleData.durationDays,
            scheduleData.intervalDays,
            scheduleData.numDisbursements,
            scheduleData.disbursementAmount,
            scheduleData.investmentDate
        ];

        const { rows: scheduleRows } = await client.query(scheduleQuery, scheduleParams);
        const scheduleId = scheduleRows[0].id;

        // Insert disbursement details
        const detailsQuery = `
            INSERT INTO disbursement_detail (
                schedule_id, disbursement_number, disbursement_date,
                disbursement_amount, status
            ) VALUES ($1, $2, $3, $4, $5);
        `;

        for (const disbursement of scheduleData.disbursementDates) {
            await client.query(detailsQuery, [
                scheduleId,
                disbursement.disbursementNumber,
                disbursement.disbursementDate,
                disbursement.disbursementAmount,
                'pending'
            ]);
        }

        if (shouldCommit) {
            await client.query('COMMIT');
        }
        
        return {
            scheduleId,
            schedule: scheduleRows[0],
            disbursements: scheduleData.disbursementDates
        };

    } catch (error) {
        if (shouldCommit) {
            await client.query('ROLLBACK');
        }
        throw error;
    } finally {
        if (shouldCommit) {
            client.release();
        }
    }
}

/**
 * Get disbursement schedule for an investor
 * @param {Object} db - Database connection
 * @param {number} investorId - Investor ID
 * @returns {Object} Complete disbursement schedule with details
 */
async function getDisbursementSchedule(db, investorId) {
    try {
        console.log(`🔍 getDisbursementSchedule: Looking for schedule for investor ${investorId}`);
        
        // Get schedule
        const scheduleQuery = `
            SELECT * FROM disbursement_schedules 
            WHERE investor_id = $1
            ORDER BY created_at DESC
            LIMIT 1;
        `;
        const { rows: scheduleRows } = await db.query(scheduleQuery, [investorId]);

        console.log(`🔍 getDisbursementSchedule: Found ${scheduleRows.length} schedules for investor ${investorId}`);
        if (scheduleRows.length > 0) {
            console.log(`🔍 getDisbursementSchedule: Schedule data:`, scheduleRows[0]);
        }

        if (scheduleRows.length === 0) {
            console.log(`⚠️ getDisbursementSchedule: No schedule found for investor ${investorId}`);
            return null;
        }

        const schedule = scheduleRows[0];

        // Get disbursement details
        const detailsQuery = `
            SELECT * FROM disbursement_detail 
            WHERE schedule_id = $1
            ORDER BY disbursement_number;
        `;
        const { rows: detailsRows } = await db.query(detailsQuery, [schedule.id]);

        console.log(`🔍 getDisbursementSchedule: Found ${detailsRows.length} disbursement details for schedule ${schedule.id}`);
        if (detailsRows.length > 0) {
            console.log(`🔍 getDisbursementSchedule: First disbursement detail:`, detailsRows[0]);
        }

        return {
            schedule,
            disbursements: detailsRows
        };

    } catch (error) {
        throw error;
    }
}

/**
 * Update existing disbursement schedule with correct calculations
 * @param {Object} db - Database connection
 * @param {number} investorId - Investor ID
 * @returns {Object} Updated schedule with correct amounts
 */
async function updateDisbursementSchedule(db, investorId) {
    const client = await db.connect();
    
    try {
        // First get the investor details
        const investorQuery = 'SELECT * FROM investordetails WHERE id = $1';
        const { rows: investorRows } = await client.query(investorQuery, [investorId]);
        
        if (investorRows.length === 0) {
            throw new Error(`Investor ${investorId} not found`);
        }
        
        const investor = investorRows[0];
        console.log(`🔄 Updating disbursement schedule for investor ${investorId}:`, {
            name: `${investor.first_name} ${investor.last_name}`,
            select_plan: investor.select_plan,
            plan_type: investor.plan_type
        });
        
        // Calculate correct disbursement schedule
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
        const scheduleData = calculateDisbursementSchedule({
            investmentAmount,
            selectPlan: investor.select_plan,
            planType: investor.plan_type || '60 days',
            investmentDate: investor.investment_date || new Date()
        });
        
        console.log(`📊 Corrected schedule data:`, scheduleData);
        
        await client.query('BEGIN');
        
        // Delete existing disbursement details
        const deleteDetailsQuery = `
            DELETE FROM disbursement_detail 
            WHERE schedule_id IN (
                SELECT id FROM disbursement_schedules WHERE investor_id = $1
            )
        `;
        await client.query(deleteDetailsQuery, [investorId]);
        
        // Delete existing disbursement schedule
        const deleteScheduleQuery = `
            DELETE FROM disbursement_schedules WHERE investor_id = $1
        `;
        await client.query(deleteScheduleQuery, [investorId]);
        
        // Create new disbursement schedule with correct amounts
        const scheduleQuery = `
            INSERT INTO disbursement_schedules (
                investor_id, investment_amount, total_return, duration_days,
                interval_days, num_disbursements, disbursement_amount, investment_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;

        const scheduleParams = [
            investorId,
            scheduleData.investmentAmount,
            scheduleData.totalReturn,
            scheduleData.durationDays,
            scheduleData.intervalDays,
            scheduleData.numDisbursements,
            scheduleData.disbursementAmount,
            scheduleData.investmentDate
        ];

        const { rows: scheduleRows } = await client.query(scheduleQuery, scheduleParams);
        const scheduleId = scheduleRows[0].id;

        // Insert corrected disbursement details
        const detailsQuery = `
            INSERT INTO disbursement_detail (
                schedule_id, disbursement_number, disbursement_date,
                disbursement_amount, status
            ) VALUES ($1, $2, $3, $4, $5);
        `;

        for (const disbursement of scheduleData.disbursementDates) {
            await client.query(detailsQuery, [
                scheduleId,
                disbursement.disbursementNumber,
                disbursement.disbursementDate,
                disbursement.disbursementAmount,
                'pending'
            ]);
        }

        await client.query('COMMIT');
        
        console.log(`✅ Successfully updated disbursement schedule for investor ${investorId}`);
        
        return {
            scheduleId,
            schedule: scheduleRows[0],
            disbursements: scheduleData.disbursementDates
        };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Error updating disbursement schedule for investor ${investorId}:`, error);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    calculateDisbursementSchedule,
    createDisbursementSchedule,
    getDisbursementSchedule,
    updateDisbursementSchedule
};

#!/usr/bin/env node

/**
 * Script to check and fix disbursement_details table data
 * This will directly update the disbursement_amount values in the disbursement_details table
 */

const db = require('../api/config/database');

async function checkAndFixDisbursementDetails() {
    console.log('🔍 Checking disbursement_details table data...');
    
    try {
        // First, let's see what's currently in the database
        const checkQuery = `
            SELECT 
                dd.id,
                dd.schedule_id,
                dd.disbursement_number,
                dd.disbursement_amount,
                dd.disbursement_date,
                ds.investor_id,
                ds.investment_amount,
                ds.total_return,
                ds.disbursement_amount as schedule_disbursement_amount,
                i.first_name,
                i.last_name,
                i.select_plan
            FROM disbursement_detail dd
            JOIN disbursement_schedules ds ON dd.schedule_id = ds.id
            JOIN investordetails i ON ds.investor_id = i.id
            ORDER BY ds.investor_id, dd.disbursement_number
        `;
        
        const { rows: disbursements } = await db.query(checkQuery);
        
        if (disbursements.length === 0) {
            console.log('ℹ️ No disbursement details found in database.');
            return;
        }
        
        console.log(`📊 Found ${disbursements.length} disbursement records`);
        
        // Group by investor to analyze
        const investorGroups = {};
        disbursements.forEach(disbursement => {
            const investorId = disbursement.investor_id;
            if (!investorGroups[investorId]) {
                investorGroups[investorId] = {
                    investor: {
                        id: disbursement.investor_id,
                        name: `${disbursement.first_name} ${disbursement.last_name}`,
                        select_plan: disbursement.select_plan,
                        investment_amount: disbursement.investment_amount,
                        total_return: disbursement.total_return
                    },
                    disbursements: []
                };
            }
            investorGroups[investorId].disbursements.push(disbursement);
        });
        
        console.log(`\n📋 Analysis by investor:`);
        
        let needsUpdateCount = 0;
        const investorsToUpdate = [];
        
        for (const [investorId, data] of Object.entries(investorGroups)) {
            const { investor, disbursements } = data;
            
            // Calculate expected values
            const expectedInvestmentAmount = investor.select_plan === '50k' ? 50000 : 100000;
            const expectedTotalReturn = expectedInvestmentAmount * 1.2;
            const expectedDisbursementAmount = expectedTotalReturn / 4;
            
            // Check current values
            const currentDisbursementAmount = parseFloat(disbursements[0].disbursement_amount);
            const needsUpdate = Math.abs(currentDisbursementAmount - expectedDisbursementAmount) > 1;
            
            console.log(`\n👤 Investor ${investorId}: ${investor.name} (${investor.select_plan})`);
            console.log(`   Investment: ₹${investor.investment_amount}`);
            console.log(`   Total Return: ₹${investor.total_return}`);
            console.log(`   Current Disbursement: ₹${currentDisbursementAmount}`);
            console.log(`   Expected Disbursement: ₹${expectedDisbursementAmount}`);
            console.log(`   Needs Update: ${needsUpdate ? '❌ YES' : '✅ NO'}`);
            
            if (needsUpdate) {
                needsUpdateCount++;
                investorsToUpdate.push({
                    investorId,
                    investor,
                    disbursements,
                    expectedDisbursementAmount
                });
            }
        }
        
        console.log(`\n📊 Summary:`);
        console.log(`   Total Investors: ${Object.keys(investorGroups).length}`);
        console.log(`   Need Updates: ${needsUpdateCount}`);
        
        if (needsUpdateCount > 0) {
            console.log(`\n🔄 Updating disbursement amounts...`);
            
            let successCount = 0;
            let failureCount = 0;
            
            for (const { investorId, investor, disbursements, expectedDisbursementAmount } of investorsToUpdate) {
                try {
                    console.log(`\n🔄 Updating investor ${investorId}: ${investor.name}`);
                    
                    // Update each disbursement detail
                    for (const disbursement of disbursements) {
                        const updateQuery = `
                            UPDATE disbursement_detail 
                            SET disbursement_amount = $1, updated_at = NOW()
                            WHERE id = $2
                        `;
                        
                        await db.query(updateQuery, [expectedDisbursementAmount, disbursement.id]);
                        console.log(`   ✅ Updated disbursement ${disbursement.disbursement_number}: ₹${expectedDisbursementAmount}`);
                    }
                    
                    // Also update the schedule table
                    const updateScheduleQuery = `
                        UPDATE disbursement_schedules 
                        SET disbursement_amount = $1, total_return = $2, updated_at = NOW()
                        WHERE investor_id = $3
                    `;
                    
                    await db.query(updateScheduleQuery, [
                        expectedDisbursementAmount, 
                        expectedTotalReturn, 
                        investorId
                    ]);
                    
                    console.log(`   ✅ Updated schedule for investor ${investorId}`);
                    successCount++;
                    
                } catch (error) {
                    failureCount++;
                    console.error(`   ❌ Failed to update investor ${investorId}:`, error.message);
                }
            }
            
            console.log(`\n🎉 Update completed!`);
            console.log(`   ✅ Successfully updated: ${successCount}`);
            console.log(`   ❌ Failed to update: ${failureCount}`);
        } else {
            console.log(`\n✅ All disbursement amounts are already correct!`);
        }
        
    } catch (error) {
        console.error('❌ Error in checkAndFixDisbursementDetails:', error);
    } finally {
        await db.end();
    }
}

// Run the script
if (require.main === module) {
    checkAndFixDisbursementDetails()
        .then(() => {
            console.log('✅ Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { checkAndFixDisbursementDetails };

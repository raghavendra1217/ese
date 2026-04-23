#!/usr/bin/env node

/**
 * Script to fix all disbursement schedules with incorrect calculations
 * This will update all existing disbursement schedules to use the correct amounts
 */

const db = require('../api/config/database');
const { updateDisbursementSchedule } = require('../api/utils/disbursementCalculator');

async function fixAllDisbursementSchedules() {
    console.log('🚀 Starting disbursement schedule fix for all investors...');
    
    try {
        // Get all investors with disbursement schedules
        const query = `
            SELECT DISTINCT ds.investor_id, i.first_name, i.last_name, i.select_plan
            FROM disbursement_schedules ds
            JOIN investordetails i ON ds.investor_id = i.id
            ORDER BY ds.investor_id
        `;
        
        const { rows: investors } = await db.query(query);
        
        if (investors.length === 0) {
            console.log('ℹ️ No investors with disbursement schedules found.');
            return;
        }
        
        console.log(`📊 Found ${investors.length} investors with disbursement schedules`);
        
        let successCount = 0;
        let failureCount = 0;
        
        for (const investor of investors) {
            try {
                console.log(`\n🔄 Processing investor ${investor.investor_id}: ${investor.first_name} ${investor.last_name} (${investor.select_plan})`);
                
                await updateDisbursementSchedule(db, investor.investor_id);
                successCount++;
                
                console.log(`✅ Successfully updated disbursement schedule for investor ${investor.investor_id}`);
                
            } catch (error) {
                failureCount++;
                console.error(`❌ Failed to update disbursement schedule for investor ${investor.investor_id}:`, error.message);
            }
        }
        
        console.log(`\n🎉 Disbursement schedule fix completed!`);
        console.log(`📊 Summary:`);
        console.log(`   ✅ Successfully updated: ${successCount}`);
        console.log(`   ❌ Failed to update: ${failureCount}`);
        console.log(`   📈 Success rate: ${((successCount / investors.length) * 100).toFixed(2)}%`);
        
    } catch (error) {
        console.error('❌ Error in fixAllDisbursementSchedules:', error);
    } finally {
        await db.end();
    }
}

// Run the script
if (require.main === module) {
    fixAllDisbursementSchedules()
        .then(() => {
            console.log('✅ Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { fixAllDisbursementSchedules };

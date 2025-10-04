#!/usr/bin/env node

/**
 * Script to test the vendors query with coordinator data
 */

const db = require('../api/config/database');

async function testVendorsQuery() {
    console.log('🔍 Testing vendors query with coordinator data...');

    try {
        const query = `
            SELECT 
                v.id,
                v.vendor_name,
                v.email,
                v.phone_number,
                v.created_at AS joining_date,
                v.passport_photo_url,
                v.coordinator_id,
                c.name AS coordinator_name,
                l.status,
                COALESCE(w.digital_money, 0) AS wallet_balance,
                w.percentage
            FROM vendors v
            JOIN login l ON v.id = l.user_id
            LEFT JOIN wallet w ON v.id = w.id
            LEFT JOIN coordinator c ON v.coordinator_id = c.coordinator_id
            WHERE l.role = 'vendor'
            LIMIT 5
        `;
        
        const result = await db.query(query);
        console.log(`✅ Found ${result.rows.length} vendors with coordinator data:`);
        
        result.rows.forEach((v, index) => {
            console.log(`\n${index + 1}. Vendor: ${v.vendor_name} (${v.id})`);
            console.log(`   Email: ${v.email}`);
            console.log(`   Status: ${v.status}`);
            console.log(`   Coordinator: ${v.coordinator_name || 'No Coordinator'}`);
            console.log(`   Wallet: ₹${v.wallet_balance}`);
            console.log(`   Commission: ${v.percentage || 'N/A'}%`);
        });

        console.log('\n🎉 Query test completed successfully!');

    } catch (error) {
        console.error('❌ Error testing vendors query:', error.message);
    }
}

// Run the script
if (require.main === module) {
    testVendorsQuery()
        .then(() => {
            console.log('✅ Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { testVendorsQuery };

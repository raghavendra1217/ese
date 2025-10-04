#!/usr/bin/env node

/**
 * Script to check the indexes on the coordinator table
 */

const db = require('../api/config/database');

async function checkCoordinatorIndexes() {
    console.log('🔍 Checking coordinator table indexes...');

    try {
        const query = `
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'coordinator'
            ORDER BY indexname;
        `;

        const result = await db.query(query);

        if (result.rows.length === 0) {
            console.log('ℹ️ No indexes found on coordinator table');
        } else {
            console.log('📋 Coordinator table indexes:');
            result.rows.forEach(row => {
                console.log(`  ${row.indexname}: ${row.indexdef}`);
            });
        }

        console.log('✅ Index check completed successfully');

    } catch (error) {
        console.error('❌ Error checking indexes:', error.message);
    }
}

// Run the script
if (require.main === module) {
    checkCoordinatorIndexes()
        .then(() => {
            console.log('✅ Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { checkCoordinatorIndexes };

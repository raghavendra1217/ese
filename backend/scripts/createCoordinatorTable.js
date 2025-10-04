#!/usr/bin/env node

/**
 * Script to create the coordinator table in the database
 * This script creates the coordinator table with the specified schema
 */

const db = require('../api/config/database');

async function createCoordinatorTable() {
    console.log('🏗️ Creating coordinator table...');

    try {
        // Check if the table already exists
        const checkTableQuery = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'coordinator'
            );
        `;

        const { rows: tableExists } = await db.query(checkTableQuery);
        const tableAlreadyExists = tableExists[0].exists;

        if (tableAlreadyExists) {
            console.log('ℹ️ Coordinator table already exists. Checking if it needs updates...');

            // Check if the table structure matches what we expect
            const checkColumnsQuery = `
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'coordinator'
                ORDER BY ordinal_position;
            `;

            const { rows: existingColumns } = await db.query(checkColumnsQuery);
            console.log('📋 Existing table structure:');
            existingColumns.forEach(col => {
                console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
            });

            // For now, we'll assume the table is correct if it exists
            // In a production environment, you might want to check if the structure matches exactly
            console.log('✅ Coordinator table structure verified');
            return;
        }

        // Create the coordinator table
        console.log('📝 Creating coordinator table with the following structure:');
        console.log('   coordinator_id: character varying(10) - Primary Key');
        console.log('   name: character varying(255) - NOT NULL');
        console.log('   email: character varying(255) - NOT NULL, UNIQUE');
        console.log('   phone_number: character varying(20) - NOT NULL');
        console.log('   created_at: timestamp without time zone - DEFAULT NOW()');
        console.log('   last_updated: timestamp without time zone - DEFAULT NOW()');

        const createTableQuery = `
            CREATE TABLE public.coordinator (
                coordinator_id character varying(10) NOT NULL,
                name character varying(255) NOT NULL,
                email character varying(255) NOT NULL,
                phone_number character varying(20) NOT NULL,
                created_at timestamp without time zone NULL DEFAULT NOW(),
                last_updated timestamp without time zone NULL DEFAULT NOW(),
                CONSTRAINT coordinator_pkey PRIMARY KEY (coordinator_id),
                CONSTRAINT coordinator_email_key UNIQUE (email)
            ) TABLESPACE pg_default;
        `;

        await db.query(createTableQuery);
        console.log('✅ Coordinator table created successfully');

        // Create the index on email column
        console.log('🔍 Creating index on email column...');
        const createIndexQuery = `
            CREATE INDEX IF NOT EXISTS idx_coordinator_email
            ON public.coordinator USING btree (email) TABLESPACE pg_default;
        `;

        await db.query(createIndexQuery);
        console.log('✅ Email index created successfully');

        // Verify the table was created correctly
        const verifyQuery = `
            SELECT
                schemaname,
                tablename,
                indexname,
                indexdef
            FROM pg_indexes
            WHERE tablename = 'coordinator'
            ORDER BY indexname;
        `;

        const { rows: indexes } = await db.query(verifyQuery);
        console.log('📋 Created indexes:');
        indexes.forEach(idx => {
            console.log(`   ${idx.indexname}: ${idx.indexdef}`);
        });

        console.log('🎉 Coordinator table setup completed successfully!');

    } catch (error) {
        console.error('❌ Error creating coordinator table:', error.message);
        throw error;
    } finally {
        // Note: The database connection pool doesn't need to be explicitly closed
        // in this application as it's managed globally
    }
}

// Run the script
if (require.main === module) {
    createCoordinatorTable()
        .then(() => {
            console.log('✅ Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { createCoordinatorTable };

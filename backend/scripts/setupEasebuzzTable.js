// Database setup script for Easebuzz payments table
const db = require('../api/config/database');

async function createEasebuzzPaymentsTable() {
  const client = await db.connect();
  
  try {
    console.log('Creating easebuzz_payments table...');
    
    // Create the easebuzz_payments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS easebuzz_payments (
        id SERIAL PRIMARY KEY,
        easebuzz_txn_id VARCHAR(255) NOT NULL UNIQUE,
        internal_txn_id INTEGER,
        user_id VARCHAR(255) NOT NULL,
        amount NUMERIC(10,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        productinfo TEXT,
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        customer_phone VARCHAR(20),
        payment_status VARCHAR(50) DEFAULT 'initiated',
        easebuzz_payment_id VARCHAR(255),
        gateway_response JSONB,
        success_url VARCHAR(500),
        failure_url VARCHAR(500),
        udf1 VARCHAR(255),
        udf2 VARCHAR(255),
        udf3 VARCHAR(255),
        udf4 VARCHAR(255),
        udf5 VARCHAR(255),
        udf6 VARCHAR(255),
        udf7 VARCHAR(255),
        udf8 VARCHAR(255),
        udf9 VARCHAR(255),
        udf10 VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        payment_completed_at TIMESTAMP WITH TIME ZONE,
        gateway_fee NUMERIC(10,2) DEFAULT 0,
        net_amount NUMERIC(10,2),
        hash_verified BOOLEAN DEFAULT FALSE,
        webhook_received BOOLEAN DEFAULT FALSE,
        webhook_count INTEGER DEFAULT 0,
        
        CONSTRAINT easebuzz_payments_pkey PRIMARY KEY (id),
        CONSTRAINT easebuzz_payments_internal_txn_id_fkey FOREIGN KEY (internal_txn_id) REFERENCES transaction(trans_id)
      );
    `);
    
    console.log('✅ easebuzz_payments table created successfully');
    
    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_easebuzz_payments_user_id ON easebuzz_payments(user_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_easebuzz_payments_txn_id ON easebuzz_payments(easebuzz_txn_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_easebuzz_payments_status ON easebuzz_payments(payment_status);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_easebuzz_payments_created_at ON easebuzz_payments(created_at);
    `);
    
    console.log('✅ Indexes created successfully');
    
    // Check if the table was created successfully
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'easebuzz_payments'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Table verification successful');
      
      // Show table structure
      const structure = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'easebuzz_payments' 
        ORDER BY ordinal_position;
      `);
      
      console.log('\n📋 Table structure:');
      console.table(structure.rows);
      
    } else {
      throw new Error('Table creation failed');
    }
    
  } catch (error) {
    console.error('❌ Error creating easebuzz_payments table:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the script if called directly
if (require.main === module) {
  createEasebuzzPaymentsTable()
    .then(() => {
      console.log('🎉 Database setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createEasebuzzPaymentsTable };

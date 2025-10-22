// backend/api/config/supabase.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please add SUPABASE_URL and SUPABASE_ANON_KEY to your .env file');
}

// Create client with anon key for general operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create client with service role key for storage operations (bypasses RLS)
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

// Function to test Supabase bucket storage connection
const testSupabaseConnection = async () => {
  try {
    console.log('🟡 Testing Supabase bucket storage connection...');
    
    // Check if environment variables are set
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.log('❌ Supabase environment variables not configured');
      return false;
    }
    
    console.log(`🔗 Supabase URL: ${process.env.SUPABASE_URL}`);
    console.log(`🔑 Supabase Key: ${process.env.SUPABASE_ANON_KEY.substring(0, 10)}...`);
    
    // Validate URL format
    if (!process.env.SUPABASE_URL.includes('.supabase.co')) {
      console.log('⚠️  Warning: Supabase URL format may be incorrect. Expected format: https://project.supabase.co');
    }
    
    // Test basic connection first with a simple query
    console.log('🔍 Testing basic Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('resumes')
      .select('count', { count: 'exact', head: true });
    
    if (testError && testError.code !== 'PGRST116') { // PGRST116 = table doesn't exist, which is ok
      console.log('❌ Supabase basic connection failed:', testError.message);
      return false;
    }
    
    console.log('✅ Supabase basic connection successful');
    
    // Test storage connection
    console.log('🔍 Testing Supabase storage connection...');
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.log('❌ Supabase bucket storage connection failed:', error.message);
      console.log('   This may be due to insufficient permissions or incorrect URL format.');
      return false;
    }
    
    console.log(`✅ Supabase bucket storage connection successful. Found ${buckets.length} bucket(s):`);
    buckets.forEach(bucket => {
      console.log(`   📦 ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    
    return true;
  } catch (error) {
    console.log('❌ Supabase connection test failed:', error.message);
    console.log('   This may indicate configuration issues or network problems.');
    return false;
  }
};

module.exports = { supabase, supabaseAdmin, testSupabaseConnection };

// Test if ENV variables are loaded correctly
require('dotenv').config();

console.log('\n=== ENV Variable Test ===\n');

console.log('1. PRODUCT_DISPLAY_TIME_SLOTS:');
console.log('   ', process.env.PRODUCT_DISPLAY_TIME_SLOTS || 'NOT FOUND ❌');

console.log('\n2. INDIVIDUAL_QUOTA_TIME_SLOTS:');
console.log('   ', process.env.INDIVIDUAL_QUOTA_TIME_SLOTS || 'NOT FOUND ❌');

console.log('\n3. Current directory:');
console.log('   ', __dirname);

console.log('\n4. .env file location:');
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
console.log('   ', envPath);
console.log('   ', fs.existsSync(envPath) ? 'EXISTS ✓' : 'NOT FOUND ❌');

if (fs.existsSync(envPath)) {
    console.log('\n5. .env file contents (searching for INDIVIDUAL_QUOTA):');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    const quotaLine = lines.find(line => line.includes('INDIVIDUAL_QUOTA_TIME_SLOTS'));
    console.log('   ', quotaLine || 'Line not found in .env ❌');
}

console.log('\n=========================\n');


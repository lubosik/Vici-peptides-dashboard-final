#!/usr/bin/env node
/**
 * Verify .env.local file has required variables
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found in project root');
  process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf-8');
const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const found = {};
const missing = [];

requiredVars.forEach(varName => {
  const line = lines.find(l => l.startsWith(varName + '='));
  if (line) {
    const value = line.split('=')[1]?.trim();
    if (value && value.length > 0) {
      found[varName] = value.substring(0, 20) + '...';
    } else {
      missing.push(varName + ' (empty value)');
    }
  } else {
    missing.push(varName);
  }
});

console.log('\n📋 Environment Variables Check\n');
console.log('✅ Found:');
Object.entries(found).forEach(([key, value]) => {
  console.log(`   ${key}: ${value}`);
});

if (missing.length > 0) {
  console.log('\n❌ Missing or empty:');
  missing.forEach(v => console.log(`   ${v}`));
  console.log('\n⚠️  Please ensure all required variables are set in .env.local');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set!');
  console.log('\n💡 Next steps:');
  console.log('   1. Make sure .env.local is saved (no unsaved changes)');
  console.log('   2. Restart the dev server: npm run dev');
  console.log('   3. Visit http://localhost:3000');
}

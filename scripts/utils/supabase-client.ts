/**
 * Supabase client initialization
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';

// Load .env.local first (takes precedence), then .env
const envLocalPath = resolve(process.cwd(), '.env.local');
const envPath = resolve(process.cwd(), '.env');

// Try dotenv first
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath, override: true });
}
if (existsSync(envPath)) {
  config({ path: envPath });
}

// Fallback: manually parse .env.local if dotenv didn't work
if (!process.env.SUPABASE_PROJECT_URL && !process.env.SUPABASE_URL) {
  if (existsSync(envLocalPath)) {
    try {
      const content = readFileSync(envLocalPath, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...values] = trimmed.split('=');
          if (key && values.length) {
            process.env[key.trim()] = values.join('=').trim();
          }
        }
      }
    } catch (error) {
      // Ignore parse errors
    }
  }
}

// Support both standard and user's variable names
const supabaseUrl = 
  process.env.SUPABASE_URL || 
  process.env.SUPABASE_PROJECT_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_SERVICE_KEY || 
  process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('URL found:', !!supabaseUrl);
  console.error('Key found:', !!supabaseServiceRoleKey);
  console.error('\nPlease set in .env file:');
  console.error('  SUPABASE_URL=https://your-project.supabase.co');
  console.error('  SUPABASE_SECRET_KEY=your-service-role-key');
  console.error('\nNote: You need the SERVICE_ROLE_KEY (not the anon key).');
  console.error('Get it from: Supabase Dashboard → Settings → API → service_role key (secret)');
  throw new Error('Missing Supabase credentials');
}

// Validate the key format (service role keys can be JWT tokens starting with eyJ or sb_secret_ format)
if (supabaseServiceRoleKey) {
  const isValidFormat = supabaseServiceRoleKey.startsWith('eyJ') || supabaseServiceRoleKey.startsWith('sb_secret_');
  if (!isValidFormat) {
    console.warn('⚠️  Warning: Service role key format unexpected');
    console.warn('   Expected format: starts with "eyJ" (JWT) or "sb_secret_" (new format)');
  }
}

/**
 * Supabase client with service role key (bypasses RLS)
 * Use this for server-side operations like CSV import
 */
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

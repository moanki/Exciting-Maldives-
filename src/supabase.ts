/**
 * Supabase Client Configuration
 * 
 * This module initializes the Supabase client used for all database interactions.
 * It ensures that the required environment variables are present before initialization.
 * 
 * Architecture:
 * - Uses the official @supabase/supabase-js library.
 * - Centralizes database connection logic for the entire application.
 */

import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables from the Vite environment
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

/**
 * Validation: Ensure the application has the necessary credentials to connect to the database.
 * If these are missing, the application will throw a descriptive error to aid in debugging.
 */
if (!supabaseUrl) {
  throw new Error('[Configuration Error]: VITE_SUPABASE_URL is missing. Please set it in your environment variables.');
}
if (!supabaseAnonKey) {
  throw new Error('[Configuration Error]: VITE_SUPABASE_ANON_KEY is missing. Please set it in your environment variables.');
}

/**
 * Security Check: Ensure the service_role key is not exposed to the client.
 * The service_role key bypasses Row Level Security (RLS) and should only be used in server-side environments.
 */
if (supabaseAnonKey?.startsWith('service_role')) {
  console.error('CRITICAL: You are using the Supabase "service_role" key in the browser. This is a security risk and is forbidden. Please use the "anon" key instead.');
}

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Database Interaction Patterns:
 * - Use 'supabase.from(table)' to initiate queries.
 * - Use '.select()', '.insert()', '.update()', '.delete()' for CRUD operations.
 * - Real-time subscriptions can be enabled using '.on()' on the client.
 */

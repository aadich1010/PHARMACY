import { createClient } from '@supabase/supabase-js';

// User's Supabase Project configuration
export const SUPABASE_PROJECT_ID = 'yelpaiwwuqjutnmoqcli';
export const SUPABASE_PROJECT_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;

// Client-side environment variables or default configured URL
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllbHBhaXd3dXFqdXRubW9xY2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NTUzODUsImV4cCI6MjEwMzEzMTM4NX0.kn-XR2xxGOIXktX7OVBLcGs36RhVCNEwlrVNjdWFaHo';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_PROJECT_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseAnonKey && supabaseAnonKey !== 'your-supabase-anon-key');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Checks connection health to the user's Supabase instance
 */
export async function testSupabaseConnection(): Promise<{ connected: boolean; message: string; details?: any }> {
  if (!isSupabaseConfigured) {
    return {
      connected: false,
      message: 'Supabase Anon Key is missing. Please set VITE_SUPABASE_ANON_KEY in Vercel or .env file.',
    };
  }

  try {
    const { data, error } = await supabase.from('tenants').select('id, name').limit(1);
    if (error) {
      // Table might not exist yet if SQL wasn't run
      if (error.code === '42P01') {
        return {
          connected: true,
          message: 'Connected to Supabase, but tables have not been created yet. Please execute the DDL SQL script in Supabase SQL Editor.',
          details: error,
        };
      }
      return {
        connected: false,
        message: error.message,
        details: error,
      };
    }
    return {
      connected: true,
      message: `Successfully connected to Supabase (${SUPABASE_PROJECT_ID})! Multi-tenant synchronization active.`,
      details: data,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: err.message || 'Connection failed',
    };
  }
}

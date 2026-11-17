import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

// Normalize URL in case a user pastes https://<project>.supabase.co/rest/v1/
const supabaseUrl = rawSupabaseUrl
  ? rawSupabaseUrl
      .trim()
      .replace(/\/rest\/v1\/?$/i, '')
      .replace(/\/+$/, '')
  : undefined;

const hasValidUrl =
  typeof supabaseUrl === 'string' &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-id');

const hasValidKey =
  typeof supabaseAnonKey === 'string' &&
  supabaseAnonKey.length > 20 &&
  !supabaseAnonKey.includes('your-supabase-anon');

export const isSupabaseConfigured = Boolean(hasValidUrl && hasValidKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

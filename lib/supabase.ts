import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-react-native',
    },
  },
});

// Database types
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description: string;
  reminder_date: string;
  media_url?: string;
  media_type?: string;
  is_recurring: boolean;
  recurring_type?: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface ReminderShare {
  id: string;
  reminder_id: string;
  shared_with_user_id: string;
  shared_by_user_id: string;
  can_edit: boolean;
  created_at: string;
  reminders?: Reminder;
  shared_with_profile?: Profile;
  shared_by_profile?: Profile;
}
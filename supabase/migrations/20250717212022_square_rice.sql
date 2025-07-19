/*
  # Create reminders application schema

  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `avatar_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `reminders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `description` (text)
      - `reminder_date` (timestamptz)
      - `media_url` (text, optional)
      - `media_type` (text, optional)
      - `is_recurring` (boolean)
      - `recurring_type` (text, optional)
      - `is_completed` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `reminder_shares`
      - `id` (uuid, primary key)
      - `reminder_id` (uuid, references reminders)
      - `shared_with_user_id` (uuid, references profiles)
      - `shared_by_user_id` (uuid, references profiles)
      - `can_edit` (boolean)
      - `created_at` (timestamp)

  2. Storage
    - Create storage bucket for reminder media
    - Enable RLS on storage bucket

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for shared reminder access
    - Add policies for media storage access
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  reminder_date timestamptz NOT NULL,
  media_url text,
  media_type text,
  is_recurring boolean DEFAULT false,
  recurring_type text,
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reminder_shares table
CREATE TABLE IF NOT EXISTS reminder_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id uuid REFERENCES reminders(id) ON DELETE CASCADE NOT NULL,
  shared_with_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  shared_by_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  can_edit boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(reminder_id, shared_with_user_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_shares ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can search profiles by email"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Reminders policies
CREATE POLICY "Users can read own reminders"
  ON reminders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read shared reminders"
  ON reminders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reminder_shares 
      WHERE reminder_shares.reminder_id = reminders.id 
      AND reminder_shares.shared_with_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own reminders"
  ON reminders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON reminders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update shared reminders with edit permission"
  ON reminders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reminder_shares 
      WHERE reminder_shares.reminder_id = reminders.id 
      AND reminder_shares.shared_with_user_id = auth.uid()
      AND reminder_shares.can_edit = true
    )
  );

CREATE POLICY "Users can delete own reminders"
  ON reminders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Reminder shares policies
CREATE POLICY "Users can read shares for their reminders"
  ON reminder_shares FOR SELECT
  TO authenticated
  USING (
    auth.uid() = shared_by_user_id 
    OR auth.uid() = shared_with_user_id
  );

CREATE POLICY "Users can insert shares for their reminders"
  ON reminder_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = shared_by_user_id
    AND EXISTS (
      SELECT 1 FROM reminders 
      WHERE reminders.id = reminder_shares.reminder_id 
      AND reminders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete shares for their reminders"
  ON reminder_shares FOR DELETE
  TO authenticated
  USING (auth.uid() = shared_by_user_id);

-- Create storage bucket for reminder media
INSERT INTO storage.buckets (id, name, public)
VALUES ('reminder-media', 'reminder-media', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload their own media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'reminder-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'reminder-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view shared media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'reminder-media' AND
    EXISTS (
      SELECT 1 FROM reminders r
      JOIN reminder_shares rs ON r.id = rs.reminder_id
      WHERE r.media_url LIKE '%' || name || '%'
      AND rs.shared_with_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'reminder-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_reminder_date ON reminders(reminder_date);
CREATE INDEX idx_reminder_shares_reminder_id ON reminder_shares(reminder_id);
CREATE INDEX idx_reminder_shares_shared_with_user_id ON reminder_shares(shared_with_user_id);
import { supabase, Reminder, ReminderShare } from './supabase';

export const createReminder = async (reminder: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>) => {
  console.log('Creating reminder with data:', reminder);
  
  const { data, error } = await supabase
    .from('reminders')
    .insert([reminder])
    .select()
    .single();

  if (error) {
    console.error('Error creating reminder:', error);
    throw error;
  }
  
  console.log('Reminder created successfully:', data);
  return data;
};

export const getReminders = async (userId: string) => {
  console.log('Fetching reminders for user:', userId);
  
  const { data, error } = await supabase
    .from('reminders')
    .select(`
      *,
      profiles!reminders_user_id_fkey(full_name, email)
    `)
    .eq('user_id', userId)
    .order('reminder_date', { ascending: true });

  if (error) {
    console.error('Error fetching reminders:', error);
    throw error;
  }
  
  console.log('Fetched reminders:', data);
  return data;
};

export const getReminder = async (id: string) => {
  const { data, error } = await supabase
    .from('reminders')
    .select(`
      *,
      profiles!reminders_user_id_fkey(full_name, email)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const updateReminder = async (id: string, updates: Partial<Reminder>) => {
  const { data, error } = await supabase
    .from('reminders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteReminder = async (id: string) => {
  console.log('Attempting to delete reminder:', id);
  
  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Delete reminder error:', error);
    throw error;
  }
  
  console.log('Reminder deleted successfully from database');
};

export const shareReminder = async (reminderId: string, sharedWithUserId: string, canEdit: boolean = false) => {
  const { data, error } = await supabase
    .from('reminder_shares')
    .insert([
      {
        reminder_id: reminderId,
        shared_with_user_id: sharedWithUserId,
        shared_by_user_id: (await supabase.auth.getUser()).data.user?.id,
        can_edit: canEdit,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getSharedReminders = async (userId: string) => {
  const { data, error } = await supabase
    .from('reminder_shares')
    .select(`
      *,
      reminders(*),
      shared_with_profile:profiles!reminder_shares_shared_with_user_id_fkey(full_name, email),
      shared_by_profile:profiles!reminder_shares_shared_by_user_id_fkey(full_name, email)
    `)
    .eq('shared_with_user_id', userId);

  if (error) throw error;
  return data;
};

export const removeShare = async (shareId: string) => {
  const { error } = await supabase
    .from('reminder_shares')
    .delete()
    .eq('id', shareId);

  if (error) throw error;
};

export const uploadMedia = async (uri: string, fileName: string, fileType: string) => {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  const response = await fetch(uri);
  const blob = await response.blob();

  const filePath = `${user.id}/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('reminder-media')
    .upload(filePath, blob, {
      contentType: fileType,
      upsert: true,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('reminder-media')
    .getPublicUrl(filePath);

  return publicUrl;
};

export const deleteMedia = async (mediaUrl: string) => {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  const fileName = mediaUrl.split('/').pop();
  const filePath = `${user.id}/${fileName}`;

  const { error } = await supabase.storage
    .from('reminder-media')
    .remove([filePath]);

  if (error) throw error;
};
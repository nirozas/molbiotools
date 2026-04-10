import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SavedSequence {
  id: string;
  user_id: string;
  name: string;
  sequence: string;
  annotations: any[];
  is_circular: boolean;
  created_at: string;
}

export const saveSequence = async (sequence: Partial<SavedSequence>) => {
  const { data, error } = await supabase
    .from('sequences')
    .insert([sequence])
    .select();
  
  if (error) throw error;
  return data[0];
};

export const getMySequences = async () => {
  const { data, error } = await supabase
    .from('sequences')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
};

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || ''; // Add your Supabase URL
const supabaseKey = process.env.SUPABASE_KEY || ''; // Add your Supabase API Key

export const supabase = createClient(supabaseUrl, supabaseKey);
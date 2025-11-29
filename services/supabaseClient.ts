import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xtysfwxmjhaynieoxwgh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0eXNmd3htamhheW5pZW94d2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODM3NDAsImV4cCI6MjA3OTk1OTc0MH0.6jDg-MAnviWnVl3trBL1udfdcPU_4ZoT6kpFwnMtSvw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


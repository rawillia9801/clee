import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zyitbqscoexhgtnofetk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5aXRicXNjb2V4aGd0bm9mZXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDcxOTMsImV4cCI6MjA2OTQ4MzE5M30.bxG3GwjrVMKIkEX7BBTWKCU7fNcOew6j1dbDGiJnV7M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
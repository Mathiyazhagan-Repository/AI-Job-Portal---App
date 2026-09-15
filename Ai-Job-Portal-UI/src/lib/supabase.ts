import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xslzgqxairxdygwykbes.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzbHpncXhhaXJ4ZHlnd3lrYmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NjEzNDIsImV4cCI6MjEwNDQzNzM0Mn0.gswB3Ybj0-PRv9cokHjHmHWdKPqX6AHzPFRexIH8QV4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

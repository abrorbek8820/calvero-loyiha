import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ritqqdewymzjvazpgdtl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdHFxZGV3eW16anZhenBnZHRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMDIwOTEsImV4cCI6MjA2NjU3ODA5MX0.w0VLuJzWkRONUvM8DIms3UkVmYMFphzy2aov0xSRtN4'

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: 'cookies',              // Sessiyani cookie orqali saqlash
    persistSession: true,            // Sessiya doimiy saqlansin
    autoRefreshToken: true,          // Token avtomatik yangilansin
    detectSessionInUrl: true         // URL orqali sessiyani aniqlash
  }
})

export default supabase
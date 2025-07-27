import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ritqqdewymzjvazpgdtl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdHFxZGV3eW16anZhenBnZHRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMDIwOTEsImV4cCI6MjA2NjU3ODA5MX0.w0VLuJzWkRONUvM8DIms3UkVmYMFphzy2aov0xSRtN4'
const cookieStorage = {
  getItem: (key) => {
    const cookies = document.cookie.split('; ')
    const cookie = cookies.find((item) => item.startsWith(`${key}=`))
    return cookie ? decodeURIComponent(cookie.split('=')[1]) : null
  },
  setItem: (key, value) => {
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/`
  },
  removeItem: (key) => {
    document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`
  },
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: cookieStorage,      // Shu yerda storage obyektini aniq beramiz
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bybjhpiusfnjlbhiesrp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5YmpocGl1c2ZuamxiaGllc3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMDAyMDksImV4cCI6MjA4NzY3NjIwOX0.KY6YwCeTngc4l8Rf7cDT-U1K6dg6uSFDjI5N0-yFPs0'

export const supabase = createClient(supabaseUrl, supabaseKey)
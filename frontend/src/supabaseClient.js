import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wtfbyoecevoibjsewtmj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0ZmJ5b2VjZXZvaWJqc2V3dG1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNTgzMjQsImV4cCI6MjA3MzkzNDMyNH0.x-rb9M2wJNM_UFwTeCUvRQUMRRyl8bmaKx6kwz55BtM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

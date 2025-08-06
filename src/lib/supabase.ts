import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lvbjvxyawspoarrqkfih.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2Ymp2eHlhd3Nwb2FycnFrZmloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NTQwMjgsImV4cCI6MjA3MDAzMDAyOH0.RuoQ2N3Hgtw5kDauh0Ri5BPNIOH1Jn8CGvqxV8pOd_8';

export const supabase = createClient(supabaseUrl, supabaseKey);
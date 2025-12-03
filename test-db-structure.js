// Test file to check database structure
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupportMessagesStructure() {
  try {
    console.log('Checking support_messages table structure...');
    
    // Try to select with priority column
    const { data, error } = await supabase
      .from('support_messages')
      .select('id, subject, priority, status')
      .limit(1);
    
    if (error) {
      console.error('Error:', error.message);
      console.log('Priority column likely does not exist');
    } else {
      console.log('Success! Priority column exists');
      console.log('Sample data:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkSupportMessagesStructure();

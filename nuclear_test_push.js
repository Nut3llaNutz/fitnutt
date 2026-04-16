const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://yjlbhksiyivcnjqrcsvg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbGJoa3NpeWl2Y25qcXJjc3ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMzIwMjIsImV4cCI6MjA5MDcwODAyMn0.LQZdYOmS3KeeUERb52nyelxt_R9stlS1A3TTTuii0_w';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function triggerTest(userId) {
  console.log(`Triggering Nuclear Reset 2.0 test push for User ID: ${userId}...`);
  
  const { data, error } = await supabase.functions.invoke('send-reminders', {
    body: { 
      test_user_id: userId,
      test_payload: {
        title: "Nuclear Reset Success! 🚀",
        body: "Version 2.0 is live and your phone is officially back in the game.",
        url: "/profile"
      }
    }
  });

  if (error) {
    console.error('Test trigger failed:', error);
  } else {
    console.log('Result:', data);
  }
}

const args = process.argv.slice(2);
const userId = args[0] || '1765e643-e897-4189-ac3e-e8515980f239';

triggerTest(userId);

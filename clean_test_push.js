import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yjlbhksiyivcnjqrcsvg.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbGJoa3NpeWl2Y25qcXJjc3ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMzIwMjIsImV4cCI6MjA5MDcwODAyMn0.LQZdYOmS3KeeUERb52nyelxt_R9stlS1A3TTTuii0_w';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function triggerTest() {
  const userId = process.argv[2];
  
  if (!userId) {
    console.error('Error: Missing User ID!');
    console.error('Usage: node clean_test_push.js YOUR_USER_ID');
    return;
  }

  console.log(`Triggering Clean Backend test push for User ID: ${userId}...`);
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-reminders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`
    },
    body: JSON.stringify({
      test_user_id: userId,
      test_payload: {
        title: "Clean Backend Test! 🚀",
        body: "Your new VAPID push infrastructure is working flawlessly."
      }
    })
  });

  const result = await res.json();
  console.log('Result:', result);
}

triggerTest();

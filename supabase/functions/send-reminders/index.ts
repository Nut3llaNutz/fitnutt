import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
// Fetch VAPID Keys from Supabase Secrets
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = "mailto:admin@fitnutt.netlify.app";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendPush(supabase: any, sub: any, payload: string) {
  try {
    await webpush.sendNotification({
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth }
    }, payload);
    return true;
  } catch (e: any) {
    // 404 or 410 mean the subscription is dead/unsubscribed by the user from browser settings
    if (e?.statusCode === 404 || e?.statusCode === 410) {
      console.log(`Deleting dead subscription: ${sub.endpoint}`);
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
    } else {
      console.error(`Push failed for ${sub.endpoint}:`, e);
    }
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  // Potential manual test trigger
  let testUserId: string | null = null;
  let testPayload: any = null;
  try {
    const body = await req.json();
    testUserId = body.test_user_id;
    testPayload = body.test_payload;
  } catch (e) { /* normal cron run */ }

  const now = new Date();
  
  // 1. Fetch Users & Their Settings
  const { data: users, error: userError } = await supabase
    .from('user_settings')
    .select('user_id, notification_time, supplements, timezone, meal_reminders_enabled, supp_reminders_enabled');

  if (userError || !users) {
    return new Response(JSON.stringify({ error: 'Failed to fetch users' }), { status: 500 });
  }

  // 2. Fetch all Active Subscriptions
  const { data: subs, error: subError } = await supabase
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth');
    
  if (subError) {
    console.error("Sub fetch error:", subError);
    return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions', details: subError }), { status: 500 });
  }

  // Fast lookup mapping
  const subMap = (subs || []).reduce((acc: any, sub: any) => {
    if (!acc[sub.user_id]) acc[sub.user_id] = [];
    acc[sub.user_id].push(sub);
    return acc;
  }, {});

  let sentCount = 0;

  for (const user of users) {
    const userSubs = subMap[user.user_id] || [];
    if (userSubs.length === 0) continue; // Skip users with no devices

    const isTestTrigger = testUserId && user.user_id === testUserId;
    
    // Resolve Time/Date based on user_settings.timezone
    const userTz = user.timezone || 'UTC';
    const nowInUserTz = new Date(now.toLocaleString('en-US', { timeZone: userTz }));
    
    const currentHour = nowInUserTz.getHours();
    const currentMin = nowInUserTz.getMinutes();
    const currentSlot = Math.floor(currentMin / 15) * 15;

    const [userHour, userMin] = (user.notification_time || "20:00").split(':').map(Number);
    const userSlot = Math.floor(userMin / 15) * 15;

    // Evaluate Should Fire?
    const isSuppTime = user.supp_reminders_enabled && currentHour === userHour && currentSlot === userSlot;
    const isMealTime = user.meal_reminders_enabled && (
      (currentHour === 10 && currentSlot === 30) ||
      (currentHour === 14 && currentSlot === 30) ||
      (currentHour === 21 && currentSlot === 30)
    );

    if (!isSuppTime && !isMealTime && !isTestTrigger) continue;

    let payload = null;

    if (isTestTrigger) {
      payload = JSON.stringify(testPayload || {
        title: "Clean Backend Test! 🚀",
        body: "Your new VAPID push infrastructure is working flawlessly."
      });
    } else {
      // Calculate start of day for accurate logging checks (Local Midnight -> UTC ISO string)
      const startOfDay = new Date(now.toLocaleString('en-US', { timeZone: userTz }));
      startOfDay.setHours(0,0,0,0);
      const isoDate = startOfDay.toISOString().split('T')[0];
      
      const { data: log } = await supabase
        .from('daily_logs')
        .select('id, creatine_taken, whey_taken, supplements_taken, completed_exercises')
        .eq('user_id', user.user_id)
        .eq('date', isoDate)
        .maybeSingle(); // Prevents PGRST116 throw if empty!

      if (isMealTime) {
        // ... (Meal reminder logic: simplified for brevity, you can adjust meals based on requirements)
        let mealName = currentHour === 10 ? "breakfast" : (currentHour === 14 ? "lunch" : "dinner");
        
        const { count: mealCount } = await supabase
          .from('meal_entries')
          .select('*', { count: 'exact', head: true })
          .eq('daily_log_id', log?.id || '00000000-0000-0000-0000-000000000000');

        let expectedMeals = currentHour === 10 ? 1 : (currentHour === 14 ? 2 : 3);
        if ((mealCount || 0) < expectedMeals) {
           payload = JSON.stringify({
             title: `Time to log ${mealName}? 🍽️`,
             body: "Keep that streak alive! Don't forget to log your progress."
           });
        }
      }

      if (!payload && isSuppTime) {
        const taken = log?.supplements_taken || {};
        const enabled = ((user.supplements || []) as any[]).filter(s => s.enabled);
        const untaken = enabled.filter(s => !taken[s.id]);
        
        if (enabled.some(s => s.id === 'creatine' && !log?.creatine_taken)) untaken.push({ name: 'Creatine' });
        if (enabled.some(s => s.id === 'whey' && !log?.whey_taken)) untaken.push({ name: 'Whey' });

        const isTotallyInactive = !log && !log?.creatine_taken && !log?.whey_taken && !Object.values(taken).some(v => v);

        if (isTotallyInactive) {
          payload = JSON.stringify({
            title: "Don't break your streak! ⚡",
            body: "You haven't logged anything for today yet. Time to level up?"
          });
        } else if (untaken.length > 0) {
          const names = untaken.map(s => s.name).join(", ");
          payload = JSON.stringify({
            title: "Don't forget: " + names,
            body: "Fuel the engine! Log your supplements for today."
          });
        }
      }
    }

    if (!payload) continue;

    // Fire Away!
    for (const sub of userSubs) {
      if (await sendPush(supabase, sub, payload)) {
        sentCount++;
      }
    }
  }

  return new Response(JSON.stringify({ success: true, sent: sentCount }), { headers: { 'Content-Type': 'application/json' } });
});

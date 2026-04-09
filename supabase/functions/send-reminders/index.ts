// @ts-nocheck
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = "mailto:admin@fitnutt.netlify.app";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date();
  
  // Fetch users and their push subscriptions
  const { data: users, error: userError } = await supabase
    .from('user_settings')
    .select('user_id, notification_time, supplements, timezone, meal_reminders_enabled, supp_reminders_enabled');

  const { data: subs, error: subError } = await supabase
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth');
    
  if (userError || subError || !users) {
    console.error(userError || subError);
    return new Response(JSON.stringify({ error: 'DB Fetch Failed', details: userError || subError }), { status: 500 });
  }

  // Group subscriptions by user lookup map
  const subMap = (subs || []).reduce((acc: any, sub: any) => {
    if (!acc[sub.user_id]) acc[sub.user_id] = [];
    acc[sub.user_id].push(sub);
    return acc;
  }, {});

  let sentCount = 0;

  for (const user of users) {
    const userSubs = subMap[user.user_id] || [];
    if (userSubs.length === 0) continue;

    try {
      const userTz = user.timezone || 'UTC';
      const nowInUserTz = new Date(now.toLocaleString('en-US', { timeZone: userTz }));
      const currentHour = nowInUserTz.getHours();
      const currentMin = nowInUserTz.getMinutes();
      const currentSlot = Math.floor(currentMin / 15) * 15;

      const [userHour, userMin] = (user.notification_time || "20:00").split(':').map(Number);
      const userSlot = Math.floor(userMin / 15) * 15;

      // Determine if we should check for custom supplement/streak reminders
      const isSuppTime = user.supp_reminders_enabled && currentHour === userHour && currentSlot === userSlot;
      
      // Determine if we should check for meal reminders (10:30, 16:00, 22:30)
      const isMealTime = user.meal_reminders_enabled && (
        (currentHour === 10 && currentSlot === 30) ||
        (currentHour === 16 && currentSlot === 0) ||
        (currentHour === 22 && currentSlot === 30)
      );

      if (!isSuppTime && !isMealTime) continue;

      // Find the start date of today in the user's timezone
      const startOfDay = new Date(now.toLocaleString('en-US', { timeZone: userTz }));
      startOfDay.setHours(0,0,0,0);
      const isoDate = startOfDay.toISOString().split('T')[0];
      
      const { data: log } = await supabase
        .from('daily_logs')
        .select('id, creatine_taken, whey_taken, supplements_taken, completed_exercises')
        .eq('user_id', user.user_id)
        .eq('date', isoDate)
        .single();
        
      const { count: mealCount } = await supabase
        .from('meal_entries')
        .select('*', { count: 'exact', head: true })
        .eq('daily_log_id', log?.id || '00000000-0000-0000-0000-000000000000');

      let payload = null;

      // Handle Meal Reminders
      if (isMealTime) {
        let expectedMeals = 0;
        let mealName = "";
        if (currentHour === 10) { expectedMeals = 1; mealName = "breakfast"; }
        else if (currentHour === 16) { expectedMeals = 2; mealName = "lunch"; }
        else if (currentHour === 22) { expectedMeals = 3; mealName = "dinner"; }

        if ((mealCount || 0) < expectedMeals) {
          payload = JSON.stringify({
            title: "Time to log " + mealName + "? 🍽️",
            body: "Keep that streak alive! Don't forget to fuel the engine and log your progress."
          });
        }
      }

      // Handle Supplement/Streak Reminders (only if meal reminder didn't already trigger something)
      if (!payload && isSuppTime) {
        const taken = log?.supplements_taken || {};
        const enabled = ((user.supplements || []) as any[]).filter(s => s.enabled);
        const untaken = enabled.filter(s => !taken[s.id]);
        
        if (enabled.some(s => s.id === 'creatine' && !log?.creatine_taken)) untaken.push({ name: 'Creatine' });
        if (enabled.some(s => s.id === 'whey' && !log?.whey_taken)) untaken.push({ name: 'Whey' });

        const isTotallyInactive = (mealCount || 0) === 0 && (log?.completed_exercises || []).length === 0 && !log?.creatine_taken && !log?.whey_taken && !Object.values(taken).some(v => v);

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

      if (!payload) continue;

      // Send to devices
      for (const sub of userSubs) {
        try {
          await sendPush(sub, payload); // Note: I assume sendPush is defined or I use webpush directly
          sentCount++;
        } catch(e: any) {
          console.error('Push failed vs', sub.endpoint, e);
        }
      }

    } catch (e) {
      console.error('Error processing user', user.user_id, e);
    }
  }

  return new Response(JSON.stringify({ success: true, sent: sentCount }), { headers: { 'Content-Type': 'application/json' } });

  // Add the internal push sender since this file doesn't seem to have the standalone sendPush helper exactly like supplement-nag
  async function sendPush(sub: any, payload: string) {
    try {
      await webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      }, payload);
    } catch(e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      }
      throw e;
    }
  }
});

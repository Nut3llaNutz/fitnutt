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
  
  // Fetch users and their push subscriptions safely since they both rely on auth.users rather than each other
  const { data: users, error: userError } = await supabase
    .from('user_settings')
    .select('user_id, notification_time, supplements, timezone');

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
    // Basic validation
    if (userSubs.length === 0) continue;
    if (!user.notification_time || !user.supplements) continue;

    try {
      const userTz = user.timezone || 'UTC';
      
      // Get the current time in the user's local timezone
      const nowInUserTz = new Date(now.toLocaleString('en-US', { timeZone: userTz }));
      const currentHour = nowInUserTz.getHours();
      const currentSlot = Math.floor(nowInUserTz.getMinutes() / 15) * 15; // 0, 15, 30, or 45

      // Get the user's set time
      const [userHour, userMin] = user.notification_time.split(':').map(Number);
      const userSlot = Math.floor(userMin / 15) * 15; // round their minutes down to nearest slot

      // Fire only when both hour AND 15-min slot match
      if (userHour !== currentHour || userSlot !== currentSlot) continue;

      // Find the start date of today in the user's timezone to query daily_logs properly
      const startOfDay = new Date(now.toLocaleString('en-US', { timeZone: userTz }));
      startOfDay.setHours(0,0,0,0);
      const isoDate = startOfDay.toISOString().split('T')[0];
      
      // Fetch today's log for the user including all activity indicators
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

      const taken = log?.supplements_taken || {};
      const completedExercises = log?.completed_exercises || [];
      const hasMeals = (mealCount || 0) > 0;
      const hasExercises = completedExercises.length > 0;
      const hasCoreSupps = (log?.creatine_taken || log?.whey_taken);
      const hasCustomSupps = Object.values(taken).some(v => v);
      
      const isTotallyInactive = !hasMeals && !hasExercises && !hasCoreSupps && !hasCustomSupps;
      
      let payload;

      if (isTotallyInactive) {
        payload = JSON.stringify({
          title: "Don't break your streak! ⚡",
          body: "You haven't logged anything for today yet. Time to level up?"
        });
      } else {
        // Run existing supplement reminder logic if they HAVE done something but missed supps
        const enabled = ((user.supplements || []) as any[]).filter(s => s.enabled);
        const untaken = enabled.filter(s => !taken[s.id]);
        
        // Add core supps to untaken if missing
        if (enabled.some(s => s.id === 'creatine' && !log?.creatine_taken)) untaken.push({ name: 'Creatine' });
        if (enabled.some(s => s.id === 'whey' && !log?.whey_taken)) untaken.push({ name: 'Whey' });

        if (untaken.length === 0) continue;

        const names = untaken.map(s => s.name).join(", ");
        payload = JSON.stringify({
          title: "Don't forget: " + names,
          body: ""
        });
      }

      // Send to all their registered devices
      for (const sub of userSubs) {
        try {
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          }, payload);
          sentCount++;
        } catch(e: any) {
          console.error('Push failed vs', sub.endpoint, e);
          if (e?.statusCode === 404 || e?.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
        }
      }

    } catch (e) {
      console.error('Error processing user', user.user_id, e);
    }
  }

  return new Response(JSON.stringify({ success: true, sent: sentCount }), { headers: { 'Content-Type': 'application/json' } });
});

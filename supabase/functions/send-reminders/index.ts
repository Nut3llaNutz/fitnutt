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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date();
  
  // 1. Fetch Users & Their Settings
  const { data: users, error: userError } = await supabase
    .from('user_settings')
    .select('user_id, notification_time, supplements, timezone, meal_reminders_enabled, supp_reminders_enabled');

  if (userError || !users) {
    return new Response(JSON.stringify({ error: 'Failed to fetch users' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // 2. Fetch all Active Subscriptions
  const { data: subs, error: subError } = await supabase
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth');
    
  if (subError) {
    console.error("Sub fetch error:", subError);
    return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions', details: subError }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
    if (userSubs.length === 0) continue; 

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

    if (!isSuppTime && !isMealTime) continue;

    let payload = null;

    // Calculate start of day for accurate logging checks
    const startOfDay = new Date(now.toLocaleString('en-US', { timeZone: userTz }));
    startOfDay.setHours(0,0,0,0);
    const isoDate = startOfDay.toISOString().split('T')[0];
    
    const { data: log } = await supabase
      .from('daily_logs')
      .select('id, creatine_taken, whey_taken, supplements_taken, completed_exercises')
      .eq('user_id', user.user_id)
      .eq('date', isoDate)
      .maybeSingle();

    if (isMealTime) {
      payload = JSON.stringify({
        title: "Fuel Reminder 🥩",
        body: "Check your fuel levels and log your last meal to stay on track!",
        url: "/"
      });
    } else if (isSuppTime) {
      // Find what hasn't been taken yet
      const configSupps = (user.supplements as any[]) || [];
      const userSuppsTaken = (log?.supplements_taken as Record<string, boolean>) || {};
      
      const missing = configSupps
        .filter(s => s.enabled && !userSuppsTaken[s.id])
        .map(s => s.name);

      if (missing.length > 0) {
        payload = JSON.stringify({
          title: "Supplements Check 💊",
          body: `Don't forget your: ${missing.join(', ')}`,
          url: "/"
        });
      }
    }

    if (payload) {
      for (const sub of userSubs) {
        if (await sendPush(supabase, sub, payload)) {
          sentCount++;
        }
      }
    }
  }

  return new Response(JSON.stringify({ success: true, sent: sentCount }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});

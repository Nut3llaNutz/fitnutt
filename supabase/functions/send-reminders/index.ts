import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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
    if (e?.statusCode === 404 || e?.statusCode === 410) {
      console.log(`Deleting dead subscription: ${sub.endpoint}`);
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
    } else {
      console.error(`Push failed for ${sub.endpoint}:`, e?.statusCode, e?.body);
    }
    return false;
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Always use service role for full DB access
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date();

  console.log(`[send-reminders] Fired at UTC: ${now.toISOString()}`);

  // 1. Fetch Users & Their Settings
  const { data: users, error: userError } = await supabase
    .from('user_settings')
    .select('user_id, notification_time, supplements, timezone, meal_reminders_enabled, supp_reminders_enabled');

  if (userError || !users) {
    console.error("User fetch error:", userError);
    return new Response(JSON.stringify({ error: 'Failed to fetch users', details: userError }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  console.log(`[send-reminders] Found ${users.length} users`);

  // 2. Fetch all Active Subscriptions
  const { data: subs, error: subError } = await supabase
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth');

  if (subError) {
    console.error("Sub fetch error:", subError);
    return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions', details: subError }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  console.log(`[send-reminders] Found ${(subs || []).length} subscriptions`);

  // Fast lookup mapping
  const subMap = (subs || []).reduce((acc: any, sub: any) => {
    if (!acc[sub.user_id]) acc[sub.user_id] = [];
    acc[sub.user_id].push(sub);
    return acc;
  }, {});

  let sentCount = 0;
  const log_entries: any[] = [];

  for (const user of users) {
    const userSubs = subMap[user.user_id] || [];

    if (userSubs.length === 0) {
      log_entries.push({ user: user.user_id, skip: 'no_subscription' });
      continue;
    }

    // Resolve Time/Date based on user_settings.timezone
    const userTz = user.timezone || 'UTC';
    let nowInUserTz: Date;
    try {
      nowInUserTz = new Date(now.toLocaleString('en-US', { timeZone: userTz }));
    } catch {
      nowInUserTz = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    }

    const currentHour = nowInUserTz.getHours();
    const currentMin = nowInUserTz.getMinutes();

    // Round to the nearest 15-min slot (e.g. 20:33 => 20:30)
    const currentSlot = Math.floor(currentMin / 15) * 15;

    const [userHour, userMin] = (user.notification_time || "20:00").split(':').map(Number);
    // Also round the user's configured time to a 15-min slot
    const userSlot = Math.floor(userMin / 15) * 15;

    const isSuppTime = user.supp_reminders_enabled &&
      currentHour === userHour &&
      currentSlot === userSlot;

    // Fixed meal reminder times: 10:30, 14:30, 21:30
    const isMealTime = user.meal_reminders_enabled && (
      (currentHour === 10 && currentSlot === 30) ||
      (currentHour === 14 && currentSlot === 30) ||
      (currentHour === 21 && currentSlot === 30)
    );

    log_entries.push({
      user: user.user_id,
      tz: userTz,
      localTime: `${currentHour}:${String(currentMin).padStart(2,'0')}`,
      slot: `${currentHour}:${String(currentSlot).padStart(2,'0')}`,
      userNotifTime: user.notification_time,
      userSlot: `${userHour}:${String(userSlot).padStart(2,'0')}`,
      isSuppTime,
      isMealTime,
      suppEnabled: user.supp_reminders_enabled,
      mealEnabled: user.meal_reminders_enabled,
    });

    if (!isSuppTime && !isMealTime) continue;

    // Get today's log for this user to check what's been taken
    const isoDate = nowInUserTz.toISOString().split('T')[0];
    // More accurate local date
    const y = nowInUserTz.getFullYear();
    const m = String(nowInUserTz.getMonth() + 1).padStart(2, '0');
    const d = String(nowInUserTz.getDate()).padStart(2, '0');
    const localDate = `${y}-${m}-${d}`;

    const { data: dailyLog } = await supabase
      .from('daily_logs')
      .select('id, supplements_taken')
      .eq('user_id', user.user_id)
      .eq('date', localDate)
      .maybeSingle();

    let payload = null;

    if (isMealTime) {
      payload = JSON.stringify({
        title: "Fuel Reminder 🥩",
        body: "Check your fuel levels and log your last meal to stay on track!",
        url: "/"
      });
    } else if (isSuppTime) {
      const configSupps = (user.supplements as any[]) || [];
      const userSuppsTaken = (dailyLog?.supplements_taken as Record<string, boolean>) || {};

      const missing = configSupps
        .filter(s => s.enabled && !userSuppsTaken[s.id])
        .map(s => s.name);

      if (missing.length > 0) {
        payload = JSON.stringify({
          title: "Supplements Check 💊",
          body: `Don't forget your: ${missing.join(', ')}`,
          url: "/"
        });
      } else if (configSupps.filter(s => s.enabled).length === 0) {
        // No supplements configured — send generic reminder
        payload = JSON.stringify({
          title: "Supplements Check 💊",
          body: "Time for your supplements! Stay consistent. 💪",
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

  console.log(`[send-reminders] Done. Sent: ${sentCount}`);
  console.log(`[send-reminders] Log:`, JSON.stringify(log_entries, null, 2));

  return new Response(JSON.stringify({ success: true, sent: sentCount, log: log_entries }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});

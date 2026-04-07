import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;

// Web Push utilities
function base64UrlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (base64.length % 4)) % 4;
  const padded = base64 + "=".repeat(pad);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importVapidKeys() {
  const privateKeyBytes = base64UrlToUint8Array(VAPID_PRIVATE_KEY);
  const publicKeyBytes = base64UrlToUint8Array(VAPID_PUBLIC_KEY);

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    await buildPkcs8(privateKeyBytes, publicKeyBytes),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
  return privateKey;
}

async function buildPkcs8(priv: Uint8Array, pub: Uint8Array): Promise<ArrayBuffer> {
  // Build PKCS8 wrapper around raw EC private key
  const header = new Uint8Array([
    0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86,
    0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d,
    0x03, 0x01, 0x07, 0x04, 0x6d, 0x30, 0x6b, 0x02, 0x01, 0x01, 0x04, 0x20,
  ]);
  const mid = new Uint8Array([0xa1, 0x44, 0x03, 0x42, 0x00]);
  const result = new Uint8Array(header.length + priv.length + mid.length + pub.length);
  result.set(header, 0);
  result.set(priv, header.length);
  result.set(mid, header.length + priv.length);
  result.set(pub, header.length + priv.length + mid.length);
  return result.buffer;
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  let binary = "";
  for (const b of arr) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createJwt(audience: string, privateKey: CryptoKey): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 86400,
    sub: "mailto:noreply@fitnutt.netlify.app",
  };

  const enc = new TextEncoder();
  const headerB64 = uint8ArrayToBase64Url(enc.encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64Url(enc.encode(JSON.stringify(payload)));
  const unsigned = `${headerB64}.${payloadB64}`;

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    enc.encode(unsigned)
  );

  // Convert DER signature to raw r||s
  const sigBytes = new Uint8Array(signature);
  let raw: Uint8Array;
  if (sigBytes.length === 64) {
    raw = sigBytes;
  } else {
    // DER decode
    let offset = 2;
    const rLen = sigBytes[offset + 1];
    offset += 2;
    const r = sigBytes.slice(offset, offset + rLen);
    offset += rLen + 1;
    const sLen = sigBytes[offset];
    offset += 1;
    const s = sigBytes.slice(offset, offset + sLen);
    raw = new Uint8Array(64);
    raw.set(r.length > 32 ? r.slice(r.length - 32) : r, 32 - Math.min(r.length, 32));
    raw.set(s.length > 32 ? s.slice(s.length - 32) : s, 64 - Math.min(s.length, 32));
  }

  const sigB64 = uint8ArrayToBase64Url(raw);
  return `${unsigned}.${sigB64}`;
}

async function sendPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  privateKey: CryptoKey
): Promise<boolean> {
  try {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;
    const jwt = await createJwt(audience, privateKey);

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        TTL: "86400",
        Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
      },
      body: payload,
    });

    if (!response.ok) {
      console.error(`Push failed ${response.status}: ${await response.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Push error:", err);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const now = new Date();
    const currentTime = `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;
    const today = now.toISOString().split("T")[0];

    // Get users whose notification_time matches current UTC minute
    const { data: settings, error: settingsErr } = await supabase
      .from("user_settings")
      .select("user_id, notification_time")
      .eq("notification_time", currentTime);

    if (settingsErr) throw settingsErr;
    if (!settings || settings.length === 0) {
      return new Response(JSON.stringify({ message: "No users to notify at this time" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = settings.map((s: any) => s.user_id);

    // Get today's logs for these users
    const { data: logs } = await supabase
      .from("daily_logs")
      .select("user_id, creatine_taken, whey_taken")
      .eq("date", today)
      .in("user_id", userIds);

    const logMap = new Map<string, { creatine_taken: boolean; whey_taken: boolean }>();
    for (const log of logs || []) {
      logMap.set(log.user_id, log);
    }

    // Find users who haven't taken supplements
    const usersToNotify: { user_id: string; messages: string[] }[] = [];
    for (const uid of userIds) {
      const log = logMap.get(uid);
      const msgs: string[] = [];
      if (!log || !log.creatine_taken) msgs.push("💪 Take your Creatine (5g)!");
      if (!log || !log.whey_taken) msgs.push("🥛 Take your Whey Protein!");
      if (msgs.length > 0) usersToNotify.push({ user_id: uid, messages: msgs });
    }

    if (usersToNotify.length === 0) {
      return new Response(JSON.stringify({ message: "All users have taken their supplements" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get push subscriptions for these users
    const notifyUserIds = usersToNotify.map((u) => u.user_id);
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("user_id, endpoint, p256dh, auth")
      .in("user_id", notifyUserIds);

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ message: "No push subscriptions found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const privateKey = await importVapidKeys();
    let sent = 0;

    for (const user of usersToNotify) {
      const userSubs = subs.filter((s: any) => s.user_id === user.user_id);
      const body = JSON.stringify({
        title: "FitNutt Supplement Reminder",
        body: user.messages.join(" "),
        icon: "/fitnutt-logo.png",
        url: "/",
      });

      for (const sub of userSubs) {
        const ok = await sendPush(sub, body, privateKey);
        if (ok) sent++;
      }
    }

    return new Response(JSON.stringify({ message: `Sent ${sent} notifications` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

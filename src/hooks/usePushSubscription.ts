import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export const usePushSubscription = () => {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
      // Check if already subscribed
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
        });
      });
    }
  }, []);

  const subscribe = useCallback(async (): Promise<{ ok: boolean; step?: string; error?: string }> => {
    if (!user || !isSupported) return { ok: false, step: "pre-check", error: `user=${!!user}, supported=${isSupported}` };

    try {
      // 1. Critical: Request permission immediately to maintain user gesture context
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        alert("Notification Permission Denied: " + perm);
        return { ok: false, step: "permission", error: `Permission result: ${perm}` };
      }

      // 2. Safeguard VAPID Key
      if (!VAPID_PUBLIC_KEY) {
        alert("CRITICAL ERROR: VITE_VAPID_PUBLIC_KEY is not defined in the production build!");
        return { ok: false, step: "config", error: "Missing VAPID Key" };
      }

      const reg = await navigator.serviceWorker.ready;
      
      // 3. Robust Subscription
      // Using Uint8Array directly (without .buffer) is more reliable on iOS Safari
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any,
      });

      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Push subscription returned invalid/empty keys");
      }

      // 4. Database Sync
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
        },
        { onConflict: "user_id,endpoint" }
      );

      if (error) {
        alert("Database Sync Failed: " + error.message);
        return { ok: false, step: "db-save", error: error.message };
      }

      setIsSubscribed(true);
      return { ok: true };
    } catch (err: any) {
      const msg = err?.message || String(err);
      alert("Push Registration Error: " + msg);
      console.error("Push subscription error:", err);
      return { ok: false, step: "exception", error: msg };
    }
  }, [user, isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!user) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("endpoint", endpoint);
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error("Unsubscribe error:", err);
    }
  }, [user]);

  return { isSubscribed, isSupported, permission, subscribe, unsubscribe };
};

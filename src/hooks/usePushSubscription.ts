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

/** Returns true only if we are running as an installed PWA (standalone mode).
 *  On iOS this is the ONLY context where push subscriptions are allowed. */
function isStandalonePWA(): boolean {
  // iOS-specific property
  if ((navigator as any).standalone === true) return true;
  // Standard CSS media query (works on Android/desktop too)
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  return false;
}

/** True if the device appears to be iOS Safari in a regular browser tab */
function isIosSafariBrowserTab(): boolean {
  const ua = navigator.userAgent;
  const isIos = /iP(hone|ad|od)/.test(ua);
  return isIos && !isStandalonePWA();
}

/** serviceWorker.ready with a timeout so it doesn't hang forever on iOS first-launch */
function serviceWorkerReadyWithTimeout(ms = 10000): Promise<ServiceWorkerRegistration> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Service worker took too long to become ready (>10s). Try closing and reopening the app from your Home Screen.")), ms);
    navigator.serviceWorker.ready.then((reg) => {
      clearTimeout(timer);
      resolve(reg);
    }).catch(reject);
  });
}

export const usePushSubscription = () => {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    // APIs existing is not enough — on iOS they exist in-browser but subscriptions require standalone mode
    const hasApis = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    // Only report as supported when actually usable
    const supported = hasApis && !isIosSafariBrowserTab();
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

  const subscribe = useCallback(async (): Promise<{ ok: boolean; step?: string; error?: string; version?: string }> => {
    if (!user || !isSupported) return { ok: false, step: "pre-check", error: `user=${!!user}, supported=${isSupported}` };

    try {
      // 1. Critical: Request permission immediately to maintain user gesture context
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        return { ok: false, step: "permission", error: `Permission result: ${perm}` };
      }

      // 2. Safeguard VAPID Key
      if (!VAPID_PUBLIC_KEY) {
        return { ok: false, step: "config", error: "Missing VAPID Key — build env var VITE_VAPID_PUBLIC_KEY not set" };
      }

      // 3. Get active service worker registration (with iOS-safe timeout)
      const reg = await serviceWorkerReadyWithTimeout(10000);
      
      // 4. Robust Subscription
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

      // 5. Database Sync
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
        return { ok: false, step: "db-save", error: error.message };
      }

      setIsSubscribed(true);
      return { ok: true, version: "2.1.0" };
    } catch (err: any) {
      const msg = err?.message || String(err);
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

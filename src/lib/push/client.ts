/**
 * Browser side of push: support detection, subscribing this device, and
 * unsubscribing it. One subscription per browser/device; the server stores it
 * via /api/push/subscribe.
 */

export type PushSupport = "supported" | "ios-needs-install" | "unsupported" | "denied";

/** What getPushSupport looks at — injectable for tests. */
export interface PushEnv {
  hasServiceWorker: boolean;
  hasPushManager: boolean;
  hasNotification: boolean;
  permission: NotificationPermission | null;
  userAgent: string;
  maxTouchPoints: number;
  isStandalone: boolean;
}

export function readPushEnv(): PushEnv {
  const nav = navigator as Navigator & { standalone?: boolean };
  return {
    hasServiceWorker: "serviceWorker" in navigator,
    hasPushManager: "PushManager" in window,
    hasNotification: "Notification" in window,
    permission: "Notification" in window ? Notification.permission : null,
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
    isStandalone:
      window.matchMedia?.("(display-mode: standalone)").matches || nav.standalone === true,
  };
}

function isIos(env: PushEnv): boolean {
  // iPadOS Safari reports itself as "Macintosh", but has touch points.
  return (
    /iPhone|iPad|iPod/.test(env.userAgent) ||
    (/Macintosh/.test(env.userAgent) && env.maxTouchPoints > 1)
  );
}

/**
 * iOS only allows web push for apps added to the home screen (iOS 16.4+);
 * Safari itself has no PushManager there.
 */
export function getPushSupport(env: PushEnv): PushSupport {
  if (isIos(env) && !env.isStandalone) return "ios-needs-install";
  if (!env.hasServiceWorker || !env.hasPushManager || !env.hasNotification) return "unsupported";
  if (env.permission === "denied") return "denied";
  return "supported";
}

/** VAPID public key (URL-safe base64) → the byte array PushManager expects. */
export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!navigator.serviceWorker) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  return (await registration?.pushManager.getSubscription()) ?? null;
}

async function saveSubscription(subscription: PushSubscription, locale: string): Promise<void> {
  const { endpoint, keys } = subscription.toJSON();
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint, keys, locale }),
  });
  if (!res.ok) throw new Error(`subscribe failed: ${res.status}`);
}

/** Re-stores an existing subscription, e.g. after the language changed. */
export async function refreshSubscription(locale: string): Promise<void> {
  const subscription = await getCurrentSubscription();
  if (subscription) await saveSubscription(subscription, locale);
}

export async function enablePush(locale: string): Promise<"enabled" | "denied"> {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY missing");

  // Ask first: Safari only shows the prompt in direct response to a tap.
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    }));
  await saveSubscription(subscription, locale);
  return "enabled";
}

/** Turns push off on this device. Never throws — also used on sign-out. */
export async function disablePush(): Promise<void> {
  try {
    const subscription = await getCurrentSubscription();
    if (!subscription) return;
    const { endpoint } = subscription;
    await subscription.unsubscribe();
    await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
  } catch (error) {
    console.error("[push] disable failed", error);
  }
}

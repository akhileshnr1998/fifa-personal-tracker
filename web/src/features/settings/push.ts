import { fetchVapidPublicKey, type PushSubscriptionPayload } from './api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported on this device.');
  }

  return navigator.serviceWorker.register('/sw.js');
}

function formatSubscription(
  subscription: PushSubscription,
): PushSubscriptionPayload {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error('Invalid push subscription payload.');
  }
  return {
    endpoint: json.endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  };
}

export async function subscribeToPush(): Promise<PushSubscriptionPayload> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  const registration = await registerServiceWorker();
  await navigator.serviceWorker.ready;

  // Re-use an active subscription when one already exists (M5).
  // This avoids unnecessarily re-subscribing on every settings save.
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    return formatSubscription(existing);
  }

  const publicKey = await fetchVapidPublicKey();
  if (!publicKey) {
    throw new Error('Push notifications are not configured on the server.');
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });

  return formatSubscription(subscription);
}

export function isIosDevice(): boolean {
  // Prefer the modern User-Agent Client Hints API (Chromium-based browsers).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uaData = (navigator as any).userAgentData as
    | { platform?: string }
    | undefined;
  if (uaData?.platform) {
    return /iphone|ipad|ipod/i.test(uaData.platform);
  }

  // Safari fallback: classic UA string + touch point check covers iPadOS
  // desktop-mode where the UA reports "Macintosh" but maxTouchPoints > 1.
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function isStandalonePwa(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

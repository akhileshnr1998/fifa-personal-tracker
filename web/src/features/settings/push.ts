import { fetchVapidPublicKey, type PushSubscriptionPayload } from './api';

// Module-level singletons. Null until warmupPush() or subscribeToPush() initialises them.
let _swReadyPromise: Promise<ServiceWorkerRegistration> | null = null;
let _vapidKeyPromise: Promise<string> | null = null;

/** Only call this in unit tests to reset singleton state between test cases. */
export function _resetPushSingletons(): void {
  _swReadyPromise = null;
  _vapidKeyPromise = null;
}

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

/**
 * Eagerly starts Service Worker registration and the VAPID key fetch so they
 * are resolved before the user reaches the Settings page.
 *
 * Safe to call before React mounts. Idempotent — calling more than once is a
 * no-op. Errors are swallowed; subscribeToPush() will surface them if push is
 * actually requested.
 */
export function warmupPush(): void {
  if (!('serviceWorker' in navigator)) return;

  if (_swReadyPromise === null) {
    const p = registerServiceWorker().then(() => navigator.serviceWorker.ready);
    _swReadyPromise = p;
    // Prevent unhandled-rejection; reset so subscribeToPush() can retry.
    p.catch(() => {
      if (_swReadyPromise === p) _swReadyPromise = null;
    });
  }

  if (_vapidKeyPromise === null) {
    const q = fetchVapidPublicKey();
    _vapidKeyPromise = q;
    q.catch(() => {
      if (_vapidKeyPromise === q) _vapidKeyPromise = null;
    });
  }
}

export async function subscribeToPush(): Promise<PushSubscriptionPayload> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  // Re-use pre-warmed SW promise, or start fresh (fallback for tests / old browsers).
  if (_swReadyPromise === null) {
    _swReadyPromise = registerServiceWorker().then(
      () => navigator.serviceWorker.ready,
    );
  }
  const registration = await _swReadyPromise;

  // Re-use an active subscription when one already exists.
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    return formatSubscription(existing);
  }

  // Re-use pre-warmed VAPID key promise, or fetch fresh.
  if (_vapidKeyPromise === null) {
    _vapidKeyPromise = fetchVapidPublicKey();
  }
  const publicKey = await _vapidKeyPromise;
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

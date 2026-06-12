# Push Pre-warm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate "Save preferences" latency by pre-warming Service Worker registration and the VAPID key fetch at app startup, so those async steps are already resolved by the time the user clicks Save.

**Architecture:** Module-level singleton promises in `push.ts` are started by a new `warmupPush()` function called fire-and-forget in `main.tsx`. `subscribeToPush()` awaits the singletons instead of starting fresh. If the singletons haven't been initialised (tests, older browsers), it falls back to the original fetch path.

**Tech Stack:** TypeScript, Vitest, browser Push API, Service Workers, React (Vite/TSX project at `web/`)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `web/src/features/settings/push.ts` | Modify | Add `warmupPush()`, singleton state, reset-for-testing helper; rewrite `subscribeToPush()` to use singletons |
| `web/src/features/settings/push.test.ts` | Create | Unit tests for `warmupPush()` and the updated `subscribeToPush()` |
| `web/src/main.tsx` | Modify | Call `warmupPush()` before React mounts |

---

## Task 1: Convert `push.ts` to use singleton promises

**Files:**
- Modify: `web/src/features/settings/push.ts`

- [ ] **Step 1: Open and read the current file**

Read `web/src/features/settings/push.ts` in full before touching it. Understand:
- `registerServiceWorker()` calls `navigator.serviceWorker.register('/sw.js')`
- `subscribeToPush()` calls `registerServiceWorker()`, awaits `navigator.serviceWorker.ready`, then optionally calls `fetchVapidPublicKey()`

- [ ] **Step 2: Replace the contents of `push.ts` with the singleton version**

```typescript
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
```

- [ ] **Step 3: Verify the file compiles with no TypeScript errors**

```bash
cd web && npx tsc --noEmit
```

Expected: no errors.

---

## Task 2: Write unit tests for the singleton behaviour

**Files:**
- Create: `web/src/features/settings/push.test.ts`

- [ ] **Step 1: Create the test file**

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { _resetPushSingletons, subscribeToPush, warmupPush } from './push';

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('./api', () => ({
  fetchVapidPublicKey: vi.fn(),
}));

import { fetchVapidPublicKey } from './api';

// Minimal ServiceWorkerRegistration stub.
function makeRegistration(existing: PushSubscription | null = null) {
  return {
    pushManager: {
      getSubscription: vi.fn().mockResolvedValue(existing),
      subscribe: vi.fn().mockResolvedValue({
        toJSON: () => ({
          endpoint: 'https://push.example.com/sub',
          expirationTime: null,
          keys: { p256dh: 'key', auth: 'auth' },
        }),
      }),
    },
  } as unknown as ServiceWorkerRegistration;
}

function setupNavigator(registration: ServiceWorkerRegistration) {
  const swReady = Promise.resolve(registration);
  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      register: vi.fn().mockResolvedValue(registration),
      ready: swReady,
    },
    configurable: true,
  });
  Object.defineProperty(window, 'Notification', {
    value: { requestPermission: vi.fn().mockResolvedValue('granted') },
    configurable: true,
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('warmupPush', () => {
  beforeEach(() => {
    _resetPushSingletons();
    vi.mocked(fetchVapidPublicKey).mockResolvedValue('vapid-key');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('starts SW registration and VAPID key fetch on first call', () => {
    const registration = makeRegistration();
    setupNavigator(registration);

    warmupPush();

    expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
    expect(fetchVapidPublicKey).toHaveBeenCalledTimes(1);
  });

  it('is a no-op on subsequent calls', () => {
    const registration = makeRegistration();
    setupNavigator(registration);

    warmupPush();
    warmupPush();
    warmupPush();

    expect(navigator.serviceWorker.register).toHaveBeenCalledTimes(1);
    expect(fetchVapidPublicKey).toHaveBeenCalledTimes(1);
  });

  it('skips when serviceWorker is not in navigator', () => {
    // Remove serviceWorker from navigator for this test
    const original = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      configurable: true,
    });

    expect(() => warmupPush()).not.toThrow();

    // Restore
    if (original) {
      Object.defineProperty(navigator, 'serviceWorker', original);
    }
  });

  it('resets SW singleton on registration failure so subscribeToPush can retry', async () => {
    const registration = makeRegistration();
    // Define the serviceWorker mock directly so we control the register spy here.
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: vi.fn().mockRejectedValue(new Error('SW register failed')),
        ready: Promise.resolve(registration),
      },
      configurable: true,
    });

    warmupPush();

    // Wait for the rejection to propagate and reset the singleton.
    await new Promise((r) => setTimeout(r, 0));

    // After failure, calling warmupPush() again should re-attempt registration.
    warmupPush();
    expect(navigator.serviceWorker.register).toHaveBeenCalledTimes(2);
  });
});

describe('subscribeToPush — uses pre-warmed singletons', () => {
  beforeEach(() => {
    _resetPushSingletons();
    vi.mocked(fetchVapidPublicKey).mockResolvedValue('vapid-key');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not call register() or fetchVapidPublicKey() again after warmupPush()', async () => {
    const registration = makeRegistration();
    setupNavigator(registration);

    warmupPush();
    // Simulate time passing while the user fills out the form
    await new Promise((r) => setTimeout(r, 0));

    await subscribeToPush();

    // Both should still be 1 — warmupPush already started them
    expect(navigator.serviceWorker.register).toHaveBeenCalledTimes(1);
    expect(fetchVapidPublicKey).toHaveBeenCalledTimes(1);
  });

  it('falls back to a fresh fetch when warmupPush was never called', async () => {
    const registration = makeRegistration();
    setupNavigator(registration);

    await subscribeToPush();

    expect(navigator.serviceWorker.register).toHaveBeenCalledTimes(1);
    expect(fetchVapidPublicKey).toHaveBeenCalledTimes(1);
  });

  it('throws when permission is denied', async () => {
    const registration = makeRegistration();
    setupNavigator(registration);
    vi.mocked(Notification.requestPermission).mockResolvedValue('denied');

    await expect(subscribeToPush()).rejects.toThrow(
      'Notification permission was not granted.',
    );
  });

  it('re-uses existing push subscription without calling subscribe()', async () => {
    const existingSubscription = {
      toJSON: () => ({
        endpoint: 'https://push.example.com/existing',
        expirationTime: null,
        keys: { p256dh: 'p256', auth: 'auth' },
      }),
    } as unknown as PushSubscription;

    const registration = makeRegistration(existingSubscription);
    setupNavigator(registration);

    const result = await subscribeToPush();

    expect(registration.pushManager.subscribe).not.toHaveBeenCalled();
    expect(result.endpoint).toBe('https://push.example.com/existing');
  });
});
```

- [ ] **Step 2: Run the tests — expect them to fail because Task 1 is needed first**

```bash
cd web && npm test -- push.test.ts
```

Expected: tests that reference `_resetPushSingletons` and `warmupPush` will fail with "not exported" or similar until Task 1 is complete.

> If you are executing tasks in order, Task 1 is already done. Run again to see passing results.

- [ ] **Step 3: Run tests and confirm all pass**

```bash
cd web && npm test -- push.test.ts
```

Expected output: all tests in `push.test.ts` pass (green).

- [ ] **Step 4: Commit**

```bash
cd web && git add src/features/settings/push.ts src/features/settings/push.test.ts
git commit -m "feat: add warmupPush() singleton pre-warm for SW and VAPID key"
```

---

## Task 3: Call `warmupPush()` at app startup

**Files:**
- Modify: `web/src/main.tsx`

- [ ] **Step 1: Add the `warmupPush` import and call before React mounts**

Replace the current contents of `web/src/main.tsx`:

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { warmupPush } from './features/settings/push';
import './index.css';

// Start SW registration and VAPID key fetch eagerly so the Settings save path
// has no API round-trips waiting at click time.
warmupPush();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run the full test suite to confirm nothing regressed**

```bash
cd web && npm test
```

Expected: all tests pass including the existing `reminderMinutes.test.ts` and the new `push.test.ts`.

- [ ] **Step 4: Commit**

```bash
git add web/src/main.tsx
git commit -m "feat: call warmupPush() at app startup to pre-warm SW and VAPID key"
```

---

## Verification Checklist

After all tasks are complete:

- [ ] `npm test` in `web/` passes with zero failures
- [ ] `npx tsc --noEmit` in `web/` reports no errors
- [ ] Open the app in a browser with DevTools → Network tab. On initial load you should see `GET /api/user/vapid-public-key` fire immediately (not deferred to save time).
- [ ] Navigate to Settings. Fill the form. Toggle push on. Click "Save preferences". The button should complete noticeably faster than before — the only remaining network call is `PUT /api/user/settings`.
- [ ] Open DevTools → Application → Service Workers. Confirm a SW is registered on every page load (including the Fixtures screen), not only after navigating to Settings.

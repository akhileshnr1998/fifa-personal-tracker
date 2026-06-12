// @vitest-environment jsdom
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
    // 'AAAA' is valid base64 (decodes to 3 null bytes) — passes atob() inside push.ts.
    vi.mocked(fetchVapidPublicKey).mockResolvedValue('AAAA');
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
    const original = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      configurable: true,
    });

    expect(() => warmupPush()).not.toThrow();

    if (original) {
      Object.defineProperty(navigator, 'serviceWorker', original);
    }
  });

  it('resets SW singleton on registration failure so subscribeToPush can retry', async () => {
    const registration = makeRegistration();
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
    vi.mocked(fetchVapidPublicKey).mockResolvedValue('AAAA');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not call register() or fetchVapidPublicKey() again after warmupPush()', async () => {
    const registration = makeRegistration();
    setupNavigator(registration);

    warmupPush();
    // Simulate time passing while the user fills out the form.
    await new Promise((r) => setTimeout(r, 0));

    await subscribeToPush();

    // Both should still be 1 — warmupPush already started them.
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

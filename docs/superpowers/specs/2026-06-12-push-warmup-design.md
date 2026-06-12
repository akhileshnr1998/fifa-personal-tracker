# Design: Push Pre-warm — Eliminate Save Preference Latency

**Date:** 2026-06-12  
**Status:** Approved  

---

## Problem

Clicking "Save preferences" with push notifications enabled is slow because `handleSubmit` runs a sequential chain of blocking operations:

1. `registerServiceWorker()` → `navigator.serviceWorker.ready` (1–5s if SW not yet active)
2. `fetchVapidPublicKey()` → `GET /api/user/vapid-public-key` (up to ~50s on Render cold start)
3. `pushManager.subscribe()` (browser crypto + push server roundtrip)
4. `saveUserSettings()` → `PUT /api/user/settings` (API call)

Steps 1–3 all happen at click time, stalled behind each other. On a cold Render instance, step 2 alone can take ~50s, and step 4 gets a second cold hit if step 2 didn't already warm the backend.

---

## Solution: Promise Singleton Pre-warm

Introduce a `warmupPush()` function in `push.ts` that eagerly starts SW registration and the VAPID key fetch as module-level singleton promises. Call it once at app startup in `main.tsx` (fire-and-forget). By the time the user navigates to Settings, fills out the form, and clicks Save, those promises are already resolved.

`subscribeToPush()` is rewritten to await the singletons instead of starting fresh. The rest of the call stack (`useSettingsForm`, `handleSubmit`) is unchanged.

---

## Architecture

### Singletons in `push.ts`

```typescript
let _swReadyPromise: Promise<ServiceWorkerRegistration> | null = null;
let _vapidKeyPromise: Promise<string> | null = null;
```

### `warmupPush()` (new export)

- Idempotent: if singletons already exist, returns immediately.
- Starts both promises concurrently (`Promise.all` internally — they are independent).
- Swallows all errors silently. This is best-effort pre-warm; errors surface later via `subscribeToPush()`.
- Safe to call before React mounts.

### `subscribeToPush()` (modified)

- Awaits `_swReadyPromise` (or starts it if null — graceful fallback for tests/SSR).
- Awaits `_vapidKeyPromise` for the VAPID key (or fetches fresh if null).
- On VAPID fetch error, resets `_vapidKeyPromise = null` so retry doesn't re-throw a cached rejection.
- Behaviour for the user is identical; only the waiting time changes.

### `main.tsx`

```typescript
warmupPush();   // fire-and-forget, non-blocking
createRoot(document.getElementById('root')!).render(...)
```

---

## Files Changed

| File | Change |
|---|---|
| `web/src/features/settings/push.ts` | Add `warmupPush()`, convert internal registration + VAPID fetch to singletons |
| `web/src/main.tsx` | Call `warmupPush()` before React mount |

**No changes to:** `useSettingsForm.ts`, `SettingsPage.tsx`, `api.ts`, `preferences.ts`.

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| SW not supported (non-HTTPS / old browser) | `warmupPush()` silently skips; `subscribeToPush()` throws as before |
| VAPID key fetch fails during pre-warm | Error swallowed; `_vapidKeyPromise` reset to `null`; `subscribeToPush()` retries and surfaces the error |
| `warmupPush()` called twice | Second call is a no-op (singletons already set) |
| Tests that never call `warmupPush()` | Singletons are `null`; `subscribeToPush()` falls back to original fetch path |

---

## Testing

- **Existing tests** for `subscribeToPush()` require no changes — they never call `warmupPush()` so the singleton is null and the fallback path runs.
- **New unit tests** for `warmupPush()`:
  - Verify promises are created and SW registration is initiated.
  - Verify calling it a second time does not trigger additional `register()` or `fetchVapidPublicKey()` calls.
  - Verify a pre-warm error does not prevent a subsequent `subscribeToPush()` call from succeeding.

---

## Expected Impact

| Step | Before | After |
|---|---|---|
| `serviceWorker.ready` at save time | 1–5s (first visit) | ~0s (resolved at app startup) |
| `fetchVapidPublicKey()` at save time | Up to ~50s (Render cold start) | ~0s (resolved in background, Render already warm from fixtures fetch) |
| `saveUserSettings()` | Up to ~50s if cold | ~50s if first-ever load, otherwise fast (Render warmed) |
| **Total perceived save latency** | **Up to ~100s worst case** | **Only the final PUT remains** |

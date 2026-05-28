/**
 * Sentry + PostHog wrappers — wired up so flipping on the env vars
 * later starts capturing without code changes.
 *
 *   EXPO_PUBLIC_SENTRY_DSN
 *   EXPO_PUBLIC_POSTHOG_API_KEY
 *   EXPO_PUBLIC_POSTHOG_HOST  (optional, defaults to https://app.posthog.com)
 *
 * The native modules @sentry/react-native and posthog-react-native are
 * loaded lazily so the bundle stays slim until they're actually
 * configured.
 */

type SentryShape = {
  init: (opts: { dsn: string; tracesSampleRate?: number; environment?: string }) => void;
  captureException: (err: unknown) => void;
  captureMessage: (msg: string) => void;
  setUser: (user: { id?: string } | null) => void;
};

type PostHogShape = new (apiKey: string, options?: { host?: string }) => {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  identify: (distinctId: string, properties?: Record<string, unknown>) => void;
  reset: () => void;
};

let Sentry: SentryShape | null = null;
let PostHogClass: PostHogShape | null = null;
let posthogInstance: InstanceType<PostHogShape> | null = null;
let initialized = false;

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";

export function initObservability(): void {
  if (initialized) return;
  initialized = true;

  if (sentryDsn) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require("@sentry/react-native");
      Sentry = (mod.Sentry ?? mod) as SentryShape;
      Sentry?.init({
        dsn: sentryDsn,
        tracesSampleRate: 0.2,
        environment: __DEV__ ? "development" : "production",
      });
    } catch {
      Sentry = null;
      if (__DEV__) console.log("[obs] @sentry/react-native not installed");
    }
  }

  if (posthogKey) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require("posthog-react-native");
      PostHogClass = (mod.PostHog ?? mod.default ?? mod) as PostHogShape;
      posthogInstance = new PostHogClass(posthogKey, { host: posthogHost });
    } catch {
      PostHogClass = null;
      if (__DEV__) console.log("[obs] posthog-react-native not installed");
    }
  }
}

export function captureError(err: unknown): void {
  try { Sentry?.captureException(err); } catch { /* noop */ }
  if (__DEV__) console.warn("[obs] error:", err);
}

export function captureEvent(name: string, props?: Record<string, unknown>): void {
  try { posthogInstance?.capture(name, props); } catch { /* noop */ }
}

export function identifyUser(userId: string | null): void {
  try { Sentry?.setUser(userId ? { id: userId } : null); } catch { /* noop */ }
  try {
    if (userId) posthogInstance?.identify(userId);
    else posthogInstance?.reset();
  } catch { /* noop */ }
}

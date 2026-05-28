/**
 * Sentry + PostHog wrappers for the partner-web Next.js app.
 *
 *   NEXT_PUBLIC_SENTRY_DSN
 *   NEXT_PUBLIC_POSTHOG_API_KEY
 *   NEXT_PUBLIC_POSTHOG_HOST    (optional, default https://app.posthog.com)
 */

type SentryShape = {
  init: (opts: { dsn: string; tracesSampleRate?: number }) => void;
  captureException: (err: unknown) => void;
};

type PostHogShape = {
  init: (key: string, opts?: { api_host?: string }) => void;
  capture: (event: string, properties?: Record<string, unknown>) => void;
  identify: (distinctId: string, props?: Record<string, unknown>) => void;
  reset: () => void;
};

let Sentry: SentryShape | null = null;
let posthog: PostHogShape | null = null;
let initialized = false;

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_API_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";

export function initObservability(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  // Resolved at runtime via the dynamic import factory below. The
  // string names dodge TS module resolution so the deps stay
  // optional — install them only when you want to flip observability
  // on.
  if (sentryDsn) loadOptional("@sentry/browser").then((mod) => {
    Sentry = mod as SentryShape;
    Sentry?.init({ dsn: sentryDsn, tracesSampleRate: 0.2 });
  });
  if (posthogKey) loadOptional("posthog-js").then((mod) => {
    const m = mod as { default?: PostHogShape };
    posthog = (m.default ?? mod) as PostHogShape;
    posthog?.init(posthogKey, { api_host: posthogHost });
  });
}

async function loadOptional(name: string): Promise<unknown> {
  try {
    // eslint-disable-next-line no-new-func
    const dyn = new Function("n", "return import(n)") as (n: string) => Promise<unknown>;
    return await dyn(name);
  } catch {
    return null;
  }
}

export function captureError(err: unknown): void {
  try { Sentry?.captureException(err); } catch { /* noop */ }
  if (process.env.NODE_ENV !== "production") console.warn("[obs]", err);
}

export function captureEvent(name: string, props?: Record<string, unknown>): void {
  try { posthog?.capture(name, props); } catch { /* noop */ }
}

export function identifyUser(userId: string | null): void {
  try {
    if (userId) posthog?.identify(userId);
    else posthog?.reset();
  } catch { /* noop */ }
}

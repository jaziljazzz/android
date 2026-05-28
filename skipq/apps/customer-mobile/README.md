# SkipQ Customer App

React Native + Expo Router. Brand identity matches the partner web; both apps share `@skipq/algorithm`, `@skipq/api-client`, and `@skipq/shared-types`.

## Local development (with Expo Go — limited)

```bash
pnpm --filter @skipq/customer-mobile dev
```

Then scan the QR code with the Expo Go app. **Push notifications and OneSignal won't work in Expo Go** — for that you need a dev build (below).

## Dev build with EAS (push notifications work here)

OneSignal requires native modules, so Expo Go is not enough. EAS builds the app in the cloud and gives you an installable APK.

**One-time setup (run from `skipq/apps/customer-mobile/`):**

```bash
# 1. Install the EAS CLI globally
pnpm dlx eas-cli --version   # or: npm i -g eas-cli

# 2. Log into Expo
eas login

# 3. Link this folder to your EAS account (creates the project in your dashboard)
pnpm eas:init
```

`eas init` writes the project ID into `app.json`. Commit that change so subsequent builds use the same project.

**Build an Android dev APK:**

```bash
pnpm eas:build:dev:android
```

EAS spins up a build (~10–15 min), then prints a URL you can open on your phone to install the APK. The build includes Expo Dev Client, so you can connect to a local Metro instance with `pnpm dev` for hot reload.

**Push notification test once installed:**

1. Install the APK on a real Android device (emulators don't get Google Play Services for FCM in many cases).
2. Open the app, sign in with your phone OTP.
3. From Supabase Studio, manually update one of your queue entries: `update queue_entries set status='serving' where user_id='<your auth.uid()>'`.
4. The trigger in migration 0008 fires, OneSignal targets your device via `external_id`, and the notification arrives.

## Environment

Set in `.env.example`. Copy to `.env` (gitignored) for local dev with Expo Go. EAS picks them up from `eas.json` build profiles.

```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

The OneSignal app ID is hardcoded in `app.json` under `extra.oneSignalAppId` (public, safe to ship).

## File layout

```
app/
├── _layout.tsx          Root stack, OneSignal init, auth-session sync
├── (tabs)/              Bottom-tab navigator
│   ├── _layout.tsx      Tabs config (Home / Bookings / History)
│   ├── index.tsx        Home — nearby salons
│   ├── bookings.tsx     Active queue status (realtime)
│   └── history.tsx      Past visits placeholder
├── salon/[id].tsx       Salon detail + service selection sheet
├── auth/login.tsx       Phone OTP — step 1
├── auth/verify.tsx      Phone OTP — step 2
└── booking-confirmed.tsx  Post-join confirmation screen

src/
├── components/Logo.tsx  SkipQ wordmark
├── hooks/useSession.ts  Reactive Supabase session
├── lib/supabase.ts      Supabase client w/ AsyncStorage persistence
├── lib/push.ts          OneSignal wrapper (safe under Expo Go)
└── theme.ts             Brand palette + spacing tokens
```

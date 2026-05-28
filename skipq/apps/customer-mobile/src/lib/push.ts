/**
 * OneSignal wrapper.
 *
 * react-native-onesignal requires native modules and won't load under Expo
 * Go (use a dev client or EAS Build). All calls here are wrapped so that a
 * missing module doesn't crash the app — we just log and skip.
 */
import Constants from "expo-constants";

type OneSignalShape = {
  initialize: (appId: string) => void;
  login: (externalId: string) => void;
  logout: () => void;
  Notifications: {
    requestPermission: (fallbackToSettings: boolean) => Promise<boolean>;
  };
  Debug: {
    setLogLevel: (level: number) => void;
  };
};

let OneSignal: OneSignalShape | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("react-native-onesignal");
  OneSignal = mod.OneSignal ?? null;
} catch {
  OneSignal = null;
}

const extra = (Constants.expoConfig?.extra ?? {}) as { oneSignalAppId?: string };
const appId = extra.oneSignalAppId ?? process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;

let initialized = false;

export function initPush(): void {
  if (!OneSignal) {
    if (__DEV__) console.log("[push] OneSignal module unavailable (Expo Go?). Skipping init.");
    return;
  }
  if (!appId) {
    if (__DEV__) console.log("[push] No OneSignal app ID configured. Skipping init.");
    return;
  }
  if (initialized) return;
  try {
    OneSignal.initialize(appId);
    OneSignal.Notifications.requestPermission(true).catch(() => {});
    initialized = true;
  } catch (err) {
    if (__DEV__) console.warn("[push] init failed:", err);
  }
}

export function setPushExternalId(userId: string): void {
  if (!OneSignal || !initialized) return;
  try {
    OneSignal.login(userId);
  } catch (err) {
    if (__DEV__) console.warn("[push] login failed:", err);
  }
}

export function clearPushExternalId(): void {
  if (!OneSignal || !initialized) return;
  try {
    OneSignal.logout();
  } catch (err) {
    if (__DEV__) console.warn("[push] logout failed:", err);
  }
}

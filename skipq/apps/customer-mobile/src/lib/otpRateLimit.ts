/**
 * Client-side OTP rate limit (spec §14: max 5 attempts / 15-min cooldown).
 *
 * Tracks per-email send + verify attempts in AsyncStorage. The actual
 * authoritative limit lives in Supabase, but this keeps obvious abuse
 * from generating SMS / email cost.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const STORAGE_PREFIX = "skipq.otp.attempts.";

function key(email: string): string {
  return STORAGE_PREFIX + email.trim().toLowerCase();
}

async function readAttempts(email: string): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(key(email));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t): t is number => typeof t === "number");
  } catch {
    return [];
  }
}

async function writeAttempts(email: string, attempts: number[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key(email), JSON.stringify(attempts));
  } catch {
    // Ignore — best-effort.
  }
}

export interface RateLimitState {
  blocked: boolean;
  attemptsRemaining: number;
  retryInMs: number;
}

export async function checkOtpAllowed(email: string): Promise<RateLimitState> {
  const now = Date.now();
  const attempts = (await readAttempts(email)).filter((t) => now - t < WINDOW_MS);
  await writeAttempts(email, attempts);
  if (attempts.length >= MAX_ATTEMPTS) {
    const oldest = Math.min(...attempts);
    return {
      blocked: true,
      attemptsRemaining: 0,
      retryInMs: WINDOW_MS - (now - oldest),
    };
  }
  return {
    blocked: false,
    attemptsRemaining: MAX_ATTEMPTS - attempts.length,
    retryInMs: 0,
  };
}

export async function recordOtpAttempt(email: string): Promise<void> {
  const now = Date.now();
  const attempts = (await readAttempts(email)).filter((t) => now - t < WINDOW_MS);
  attempts.push(now);
  await writeAttempts(email, attempts);
}

export async function clearOtpAttempts(email: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key(email));
  } catch {
    // Ignore.
  }
}

export function formatRetryDuration(ms: number): string {
  const min = Math.ceil(ms / 60000);
  if (min <= 1) return "less than a minute";
  return `${min} min`;
}

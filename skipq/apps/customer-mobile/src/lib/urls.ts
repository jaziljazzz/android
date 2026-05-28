/**
 * Public-facing URLs the customer app shares out via Share sheets and
 * notification CTAs. Override at build time with EXPO_PUBLIC_PARTNER_URL
 * once the real domain (skipq.in) is wired up.
 */

const ENV_URL = process.env.EXPO_PUBLIC_PARTNER_URL;

export const PARTNER_BASE_URL =
  (typeof ENV_URL === "string" && ENV_URL.length > 0
    ? ENV_URL
    : "https://skipq-partner.vercel.app"
  ).replace(/\/+$/, "");

export function salonShareUrl(salonId: string): string {
  return `${PARTNER_BASE_URL}/s/${salonId}`;
}

export const SIGNUP_URL = PARTNER_BASE_URL;
export const PRIVACY_URL = `${PARTNER_BASE_URL}/privacy`;
export const ACCOUNT_URL = `${PARTNER_BASE_URL}/login`;

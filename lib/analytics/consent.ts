// lib/analytics/consent.ts
// The visitor's analytics choice, stored on their own device.
//
// Analytics is opt-in: nothing loads until `granted` is recorded here. Both
// answers are stored, because "denied" has to be remembered — otherwise the
// banner reappears every visit, which is itself a dark pattern.
//
// The record carries a timestamp so consent can lapse. The CNIL's position is
// that consent is not indefinite; six months is the interval it recommends
// re-asking on. Past that we return null, the banner comes back, and the
// visitor answers again.
import { safeStorage } from "@/lib/safe-storage";

export const CONSENT_STORAGE_KEY = "boh-analytics-consent";

/** ~6 months. Past this a stored answer is treated as absent. */
export const CONSENT_LIFETIME_MS = 183 * 24 * 60 * 60 * 1000;

/** Bump when the shape below changes; old records are then read as absent. */
const CONSENT_VERSION = 1;

export type ConsentChoice = "granted" | "denied";

type ConsentRecord = {
  v: number;
  choice: ConsentChoice;
  /** Epoch ms at which the choice was made. */
  at: number;
};

function isChoice(value: unknown): value is ConsentChoice {
  return value === "granted" || value === "denied";
}

/**
 * The pure core: a stored string and the current time in, a usable choice out.
 * Anything unreadable, outdated or expired reads as "never answered", which is
 * the safe direction — it means analytics stays off and we ask again.
 */
export function parseConsent(raw: string | null, now: number): ConsentChoice | null {
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;
  const record = parsed as Partial<ConsentRecord>;

  if (record.v !== CONSENT_VERSION) return null;
  if (!isChoice(record.choice)) return null;
  if (typeof record.at !== "number" || !Number.isFinite(record.at)) return null;
  if (now - record.at > CONSENT_LIFETIME_MS) return null;

  return record.choice;
}

export function serialiseConsent(choice: ConsentChoice, now: number): string {
  return JSON.stringify({ v: CONSENT_VERSION, choice, at: now } satisfies ConsentRecord);
}

/** null = never answered, or the answer has lapsed. Analytics stays off. */
export function readConsent(now: number = Date.now()): ConsentChoice | null {
  return parseConsent(safeStorage.getItem(CONSENT_STORAGE_KEY), now);
}

export function writeConsent(choice: ConsentChoice, now: number = Date.now()): void {
  safeStorage.setItem(CONSENT_STORAGE_KEY, serialiseConsent(choice, now));
}

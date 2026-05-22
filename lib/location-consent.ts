const KEY = "location-consent";

type Consent = "granted" | "denied" | "unknown";

export function getLocationConsent(): Consent {
  if (typeof window === "undefined") return "unknown";
  try {
    const v = localStorage.getItem(KEY);
    if (v === "granted" || v === "denied") return v;
  } catch {}
  return "unknown";
}

export function setLocationConsent(value: "granted" | "denied"): void {
  try {
    localStorage.setItem(KEY, value);
  } catch {}
}

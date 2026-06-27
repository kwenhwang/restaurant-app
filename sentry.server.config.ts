import * as Sentry from "@sentry/nextjs";

// Server runtime can use a non-public SENTRY_DSN; fall back to the public one
// (the DSN is not secret, so sharing the client var is fine).
const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    // Don't capture noisy known errors
    ignoreErrors: [
      "Gemini 429", // quota already handled gracefully
      "NEXT_REDIRECT", // not an error — control-flow signal
      "NEXT_NOT_FOUND", // same
    ],
    beforeSend(event, hint) {
      // Filter out auth-redirect signals that bubble up as errors.
      const e = hint.originalException;
      if (e && typeof e === "object" && "digest" in e) {
        const digest = String((e as { digest?: string }).digest ?? "");
        if (digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND") {
          return null;
        }
      }
      return event;
    },
  });
} else if (process.env.NODE_ENV === "production") {
  // Make "Sentry silently off in prod" detectable in the server logs.
  console.warn(
    "[sentry] No SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN set — server error monitoring is DISABLED.",
  );
}

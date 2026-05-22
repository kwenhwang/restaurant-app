import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    // Don't capture noisy known errors
    ignoreErrors: [
      "Gemini 429",  // quota already handled gracefully
    ],
  });
}

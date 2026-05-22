"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            textAlign: "center",
            background: "#F2F2F7",
          }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>앱에 오류가 발생했어요</h2>
          <p style={{ color: "#6e6e73", marginTop: 8 }}>
            새로고침 해주세요
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 20,
              height: 44,
              padding: "0 24px",
              borderRadius: 16,
              background: "#FF6F3D",
              color: "white",
              fontWeight: 700,
              border: 0,
            }}
          >
            다시 시도
          </button>
          {error.digest && (
            <p style={{ marginTop: 16, fontSize: 11, color: "#6e6e73", fontFamily: "monospace" }}>
              {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}

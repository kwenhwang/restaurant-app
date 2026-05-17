"use client";

import { useEffect, useState } from "react";

export default function RegisterSW() {
  const [updateReady, setUpdateReady] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") {
      return;
    }

    let cancelled = false;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        if (cancelled) return;

        // If a new worker is already waiting (previous session installed it)
        if (reg.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(reg.waiting);
          setUpdateReady(true);
        }

        // Listen for newly installing workers
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setWaitingWorker(newWorker);
              setUpdateReady(true);
            }
          });
        });

        // Periodically check for updates (every 30 minutes while tab is open)
        setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000);
      })
      .catch(() => {});

    // Reload page when the new SW takes control
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function applyUpdate() {
    if (!waitingWorker) {
      window.location.reload();
      return;
    }
    waitingWorker.postMessage("SKIP_WAITING");
    // The controllerchange listener above will reload the page once SW takes over.
  }

  if (!updateReady) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50 rounded-full px-4 py-2 flex items-center gap-3"
      style={{
        bottom: 100,
        background: "rgba(28,28,30,0.92)",
        color: "white",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
        maxWidth: "calc(100vw - 32px)",
      }}
    >
      <span className="text-[13px] font-semibold">새 버전이 있어요</span>
      <button
        type="button"
        onClick={applyUpdate}
        className="text-[13px] font-bold px-3 py-1 rounded-full"
        style={{ background: "var(--accent)" }}
      >
        새로고침
      </button>
      <button
        type="button"
        onClick={() => setUpdateReady(false)}
        aria-label="닫기"
        className="text-[16px] opacity-70"
      >
        ×
      </button>
    </div>
  );
}

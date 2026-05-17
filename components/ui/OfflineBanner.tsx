"use client";

import { useEffect, useState } from "react";

export default function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 text-center text-[12px] font-semibold py-1.5"
      style={{
        background: "rgba(28,28,30,0.92)",
        color: "white",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      오프라인 · 저장된 데이터를 표시 중이에요
    </div>
  );
}

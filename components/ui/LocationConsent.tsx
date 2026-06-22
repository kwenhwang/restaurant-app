"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLocationConsent, setLocationConsent } from "@/lib/location-consent";

interface Props {
  onDecision?: (granted: boolean) => void;
}

/**
 * First-time location consent modal. Shown when consent is "unknown".
 * Stores decision in localStorage so we don't ask again.
 *
 * The browser's native geolocation prompt is separate — this modal is a
 * legal-compliance pre-consent (Korean 위치정보의 보호 및 이용 등에 관한 법률).
 */
export default function LocationConsent({ onDecision }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (getLocationConsent() === "unknown") {
      // Defer a tick so initial paint isn't blocked
      const t = setTimeout(() => setShow(true), 200);
      return () => clearTimeout(t);
    }
  }, []);

  function decide(granted: boolean) {
    setLocationConsent(granted ? "granted" : "denied");
    setShow(false);
    onDecision?.(granted);
  }

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4" style={{ background: "var(--surface)" }}>
        <div className="flex items-center gap-2">
          <span className="text-[28px]">📍</span>
          <h3 className="text-[17px] font-bold">위치 정보를 사용해도 될까요?</h3>
        </div>

        <div className="space-y-2.5 text-[14px]" style={{ color: "var(--text)" }}>
          <p>
            현재 위치를 활용해 다음 기능을 제공해요:
          </p>
          <ul
            className="rounded-2xl p-3 list-disc list-inside space-y-1 text-[13px]"
            style={{ background: "var(--bg)", color: "var(--text-2)" }}
          >
            <li>주변 음식점 자동 추천 (등록 시)</li>
            <li>가까운 맛집 우선 추천</li>
            <li>지도에 내 위치 표시</li>
          </ul>
          <p className="text-[12px]" style={{ color: "var(--text-2)" }}>
            위치는 등록한 맛집에만 사용되고 별도로 저장되지 않습니다.
            언제든 브라우저 설정에서 권한을 회수할 수 있어요.{" "}
            <Link
              href="/legal/privacy"
              target="_blank"
              className="underline"
              style={{ color: "var(--accent)" }}
            >
              자세히
            </Link>
          </p>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => decide(false)}
            className="flex-1 h-12 rounded-2xl font-semibold"
            style={{ background: "var(--bg)", color: "var(--text)" }}
          >
            나중에
          </button>
          <button
            type="button"
            onClick={() => decide(true)}
            className="flex-1 h-12 rounded-2xl text-white font-bold"
            style={{ background: "var(--accent)" }}
          >
            동의하고 사용
          </button>
        </div>
      </div>
    </div>
  );
}

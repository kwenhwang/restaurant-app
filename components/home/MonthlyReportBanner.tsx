"use client";

// Home banner: "지난 달 미식 리포트가 나왔어요" — surfaces once per
// (user, yyyymm) and tucks away on dismiss (localStorage). Renders only
// when the previous month has meaningful activity (caller filters).

import { useEffect, useState } from "react";
import Link from "next/link";
import Sym from "@/components/ui/Sym";

interface Props {
  yyyymm: string;
  visitsCount: number;
  topCategory: string | null;
}

function key(yyyymm: string) {
  return `report-banner:dismissed:${yyyymm}`;
}

export default function MonthlyReportBanner({ yyyymm, visitsCount, topCategory }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(!!localStorage.getItem(key(yyyymm)));
    } catch {}
    setHydrated(true);
  }, [yyyymm]);

  if (!hydrated || dismissed) return null;

  function dismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try { localStorage.setItem(key(yyyymm), "1"); } catch {}
    setDismissed(true);
  }

  return (
    <section className="px-[18px] mt-3">
      <Link
        href={`/profile/reports/${yyyymm}`}
        className="relative block rounded-2xl overflow-hidden p-4 text-white"
        style={{
          background: "linear-gradient(135deg, #B5621E 0%, #6E2E0B 100%)",
          boxShadow: "0 8px 22px rgba(0,0,0,0.18)",
        }}
      >
        <div className="text-[11px] font-bold uppercase tracking-wider opacity-90">
          {yyyymm.replace("-", "년 ")}월 리포트
        </div>
        <div className="font-display text-[18px] font-extrabold mt-0.5">
          지난 달 미식 일지가 정리됐어요
        </div>
        <div className="text-[12.5px] mt-1 opacity-90">
          방문 {visitsCount}회{topCategory ? ` · ${topCategory} 위주` : ""} · 자세히 보기
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="배너 닫기"
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
        >
          <Sym name="xmark" size={12} strokeWidth={2.4} />
        </button>
      </Link>
    </section>
  );
}

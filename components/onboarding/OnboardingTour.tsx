// components/onboarding/OnboardingTour.tsx — v3
// First-run empty state (home, zero restaurants). Refreshed: serif headings,
// duo accent tones (orange / green / gold), warmer plate gradients. Same links.

import Link from "next/link";
import Sym from "@/components/ui/Sym";

const STEPS = [
  {
    n: 1,
    icon: "camera" as const,
    tone: "var(--accent)",
    title: "음식 사진 한 장",
    body: "식사 직후, 메뉴를 찍기만 해요. 위치도 같이 기록돼요.",
  },
  {
    n: 2,
    icon: "sparkles" as const,
    tone: "var(--accent-2)",
    title: "AI가 자동 채움",
    body: "카테고리·메뉴명·가격을 알아서 추출. 별점만 콕 찍으면 끝.",
  },
  {
    n: 3,
    icon: "map.fill" as const,
    tone: "var(--gold)",
    title: "나만의 미식 지도",
    body: "쌓일수록 가까운 단골이 한눈에. 친구에게 링크 공유도 가능.",
  },
];

const PLATES = [
  { e: "🍣", g: "linear-gradient(150deg,#FFE5EC 0%,#F49EB1 55%,#D45C86 100%)", s: 132, x: -72, y: 26, rot: -9, z: 1, elevated: false },
  { e: "☕️", g: "linear-gradient(150deg,#F2E5D5 0%,#C9A07A 55%,#8A6A4A 100%)", s: 128, x: 70, y: 34, rot: 8, z: 2, elevated: false },
  { e: "🍚", g: "linear-gradient(150deg,#FFE3D0 0%,#F58A5A 60%,#E8552E 100%)", s: 150, x: 0, y: 8, rot: -2, z: 3, elevated: true },
];

export default function OnboardingTour() {
  return (
    <>
      {/* Hero: stacked plates */}
      <div className="relative" style={{ height: 196, margin: "20px 0 4px" }}>
        {PLATES.map((p, i) => (
          <div
            key={i}
            aria-hidden
            className="absolute flex items-center justify-center animate-fade-up"
            style={{
              top: p.y, left: "50%", width: p.s, height: p.s, zIndex: p.z,
              transform: `translateX(calc(-50% + ${p.x}px)) rotate(${p.rot}deg)`,
              borderRadius: p.s / 4, background: p.g, fontSize: p.s * 0.46,
              boxShadow: p.elevated ? "var(--shadow-photo)" : "0 12px 28px rgba(40,30,15,0.1)",
              animationDelay: `${i * 0.08}s`,
            }}
          >
            {p.e}
          </div>
        ))}
      </div>

      <div className="text-center px-8 pb-1">
        <h2 className="font-display text-[26px] font-extrabold" style={{ letterSpacing: "-0.5px" }}>
          오늘 점심부터 시작해요
        </h2>
        <p className="mt-2 text-[14.5px] leading-relaxed" style={{ color: "var(--text-2)" }}>
          식사 직후 30초면 충분해요.
          <br />
          나만의 맛집 지도가 만들어지기 시작합니다.
        </p>
      </div>

      <div className="px-[18px] pt-5 flex flex-col gap-2.5">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="flex items-center gap-3.5 p-[15px]"
            style={{ borderRadius: 18, background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
          >
            <div
              className="relative flex items-center justify-center shrink-0"
              style={{ width: 46, height: 46, borderRadius: 15, color: s.tone, background: `color-mix(in srgb, ${s.tone} 13%, transparent)` }}
            >
              <Sym name={s.icon} size={23} />
              <span
                className="absolute flex items-center justify-center font-black text-white tabular-nums"
                style={{ top: -5, right: -5, width: 19, height: 19, borderRadius: 999, background: s.tone, fontSize: 10.5 }}
              >
                {s.n}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-[16.5px] font-extrabold">{s.title}</div>
              <div className="text-[13px] mt-0.5 leading-relaxed" style={{ color: "var(--text-2)" }}>
                {s.body}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-[18px] pt-6">
        <Link
          href="/capture"
          className="h-[54px] rounded-[17px] text-white text-[16.5px] font-extrabold flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform"
          style={{ background: "var(--accent)", boxShadow: "0 10px 24px color-mix(in srgb, var(--accent) 38%, transparent)" }}
        >
          <Sym name="camera" size={20} strokeWidth={2} />
          사진으로 등록 시작
        </Link>
        <div className="text-center mt-3.5">
          <Link href="/restaurants/new" className="text-[13px]" style={{ color: "var(--text-2)" }}>
            사진 없이도{" "}
            <span style={{ color: "var(--accent)", fontWeight: 700 }}>직접 입력</span>{" "}
            가능
          </Link>
        </div>
      </div>
    </>
  );
}

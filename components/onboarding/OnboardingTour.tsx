// components/onboarding/OnboardingTour.tsx
// First-run empty state — replaces the "아직 기록된 맛집이 없어요" block on home.
// Shown when the user has zero restaurants. Disappears as soon as they add one.

import Link from "next/link";
import Sym from "@/components/ui/Sym";

const STEPS = [
  {
    n: 1,
    icon: "camera" as const,
    tone: "#FF6F3D",
    title: "음식 사진 한 장",
    body: "식사 직후, 메뉴를 찍기만 해요. 위치도 같이 기록돼요.",
  },
  {
    n: 2,
    icon: "sparkles" as const,
    tone: "#7A4EC7",
    title: "AI가 자동 채움",
    body: "카테고리·메뉴명·가격을 알아서 추출. 별점만 콕 찍으면 끝.",
  },
  {
    n: 3,
    icon: "map.fill" as const,
    tone: "#2A6FDB",
    title: "나만의 미식 지도",
    body: "쌓일수록 가까운 단골이 한눈에. 친구에게 링크 공유도 가능.",
  },
];

export default function OnboardingTour() {
  return (
    <>
      {/* Hero: stacked plates */}
      <div className="relative h-[200px] mt-6 mb-2">
        <Plate emoji="🍣" gradient="linear-gradient(135deg, #FFE5EC 0%, #F49EB1 100%)"
          style={{ top: 32, left: "50%", transform: "translateX(-50%) rotate(-8deg)" }}
          size={150} fontSize={70} />
        <Plate emoji="☕️" gradient="linear-gradient(135deg, #F5E6D3 0%, #C9A07A 100%)"
          style={{ top: 20, left: "50%", transform: "translateX(calc(-50% + 60px)) rotate(6deg)" }}
          size={150} fontSize={70} />
        <Plate emoji="🍚" gradient="linear-gradient(135deg, #FFE3D3 0%, #FFB58A 100%)"
          style={{ top: 16, left: "50%", transform: "translateX(calc(-50% - 60px)) rotate(-2deg)" }}
          size={160} fontSize={80} elevated />
      </div>

      <div className="text-center px-8 pb-5">
        <h2
          className="text-[22px] font-extrabold"
          style={{ letterSpacing: "-0.5px" }}
        >
          오늘 점심부터 시작해요
        </h2>
        <p
          className="text-[14px] mt-1 leading-relaxed"
          style={{ color: "var(--text-2)" }}
        >
          식사 직후 30초면 충분해요.
          <br />
          나만의 맛집 지도가 만들어지기 시작합니다.
        </p>
      </div>

      <div className="px-4 flex flex-col gap-2.5">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="rounded-2xl p-3.5 flex items-center gap-3.5"
            style={{
              background: "var(--surface)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <div
              className="relative w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0"
              style={{ background: s.tone + "14", color: s.tone }}
            >
              <Sym name={s.icon} size={22} />
              <div
                className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-extrabold text-white"
                style={{ background: s.tone }}
              >
                {s.n}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-bold" style={{ letterSpacing: "-0.2px" }}>
                {s.title}
              </div>
              <div
                className="text-[12.5px] mt-0.5 leading-relaxed"
                style={{ color: "var(--text-2)" }}
              >
                {s.body}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 pt-6">
        <Link
          href="/capture"
          className="h-[52px] rounded-2xl text-white text-[16px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{
            background: "var(--accent)",
            boxShadow: "0 8px 20px rgba(255,111,61,0.28)",
          }}
        >
          <Sym name="camera" size={18} strokeWidth={2} />
          사진으로 등록 시작
        </Link>
        <div className="text-center mt-3">
          <Link
            href="/restaurants/new"
            className="text-[13px]"
            style={{ color: "var(--text-2)" }}
          >
            사진 없이도{" "}
            <span style={{ color: "var(--accent)", fontWeight: 600 }}>직접 입력</span>{" "}
            가능
          </Link>
        </div>
      </div>
    </>
  );
}

function Plate({
  emoji,
  gradient,
  style,
  size,
  fontSize,
  elevated,
}: {
  emoji: string;
  gradient: string;
  style: React.CSSProperties;
  size: number;
  fontSize: number;
  elevated?: boolean;
}) {
  return (
    <div
      className="absolute flex items-center justify-center"
      style={{
        ...style,
        width: size,
        height: size,
        borderRadius: size / 4,
        background: gradient,
        fontSize,
        boxShadow: elevated
          ? "0 16px 36px rgba(0,0,0,0.12)"
          : "0 12px 28px rgba(0,0,0,0.08)",
      }}
      aria-hidden="true"
    >
      {emoji}
    </div>
  );
}

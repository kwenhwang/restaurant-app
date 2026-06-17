// Premium upgrade page — value prop + KakaoPay CTA.
//
// When KakaoPay isn't wired up yet (env var KAKAOPAY_CID unset), the CTA
// renders in a disabled "준비 중" state so the page is still useful as a
// landing/value-prop preview.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPremiumStatus } from "@/lib/premium";
import { LargeTitle } from "@/components/ui/LargeTitle";
import Sym from "@/components/ui/Sym";
import UpgradeCTA from "@/components/billing/UpgradeCTA";

export const dynamic = "force-dynamic";

const VALUE_LINES = [
  { icon: "sparkles", title: "AI 무제한", body: "Discover·블로그 후기·메뉴 추출 모두 하루 50회까지" },
  { icon: "person", title: "친구 follow + 활동 피드", body: "친구의 새 발견과 공개 컬렉션을 홈에서 한눈에" },
  { icon: "star.fill", title: "월간 미식 리포트", body: "매월 1페이지로 정리되는 나만의 푸드 다이어리 (카톡 공유)" },
  { icon: "chart.bar", title: "고급 통계", body: "카테고리·지역·계절별 추세, 평점 변천사" },
] as const;

export default async function UpgradePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const status = await getPremiumStatus(supabase, user.id);
  if (status) {
    // Already premium — bounce to billing page
    redirect("/profile/billing");
  }

  const provisioned = Boolean(process.env.KAKAOPAY_CID);

  return (
    <div className="pb-24">
      <LargeTitle eyebrow="Premium" title="더 깊은 미식 기록" />

      {/* Hero pricing card */}
      <section className="px-[18px] mt-2">
        <div
          className="rounded-3xl p-6 text-white"
          style={{
            background: "linear-gradient(160deg, var(--accent) 0%, var(--accent-press) 100%)",
            boxShadow: "0 18px 40px color-mix(in srgb, var(--accent) 32%, transparent)",
          }}
        >
          <div className="text-[12px] font-bold uppercase tracking-wider opacity-90">eatlog Premium</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-[42px] font-black">4,900</span>
            <span className="text-[15px] font-bold opacity-90">원/월</span>
          </div>
          <div className="text-[13px] mt-1 opacity-90">
            연 39,000원 (33% 할인) · 첫 1개월 무료
          </div>
          <UpgradeCTA provisioned={provisioned} />
        </div>
      </section>

      {/* Value prop list */}
      <section className="px-[18px] mt-7 space-y-3">
        {VALUE_LINES.map((v) => (
          <div
            key={v.title}
            className="rounded-2xl p-4 flex items-start gap-3"
            style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
          >
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "var(--accent-soft)", color: "var(--accent-press)" }}
            >
              <Sym name={v.icon as Parameters<typeof Sym>[0]["name"]} size={18} />
            </span>
            <div className="min-w-0">
              <div className="font-display text-[16px] font-extrabold">{v.title}</div>
              <p className="text-[13px] mt-0.5" style={{ color: "var(--text-2)" }}>
                {v.body}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Free vs Premium */}
      <section className="px-[18px] mt-7">
        <h2 className="font-display text-[18px] font-extrabold mb-3 px-1">free에서도 그대로</h2>
        <div
          className="rounded-2xl p-4 text-[13px] leading-relaxed"
          style={{ background: "var(--surface)", color: "var(--text-2)" }}
        >
          식당 등록·메모·평점·즐겨찾기·방문 기록·공유 링크 모두 무제한 무료. 코어 기능을 가두지 않아요.
          Premium은 AI 사용량·소셜·통계 같은 “더 깊이” 영역에서만 작동합니다.
        </div>
      </section>

      {/* FAQ */}
      <section className="px-[18px] mt-7">
        <h2 className="font-display text-[18px] font-extrabold mb-3 px-1">자주 묻는 질문</h2>
        <details className="rounded-2xl p-4" style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}>
          <summary className="font-bold text-[14px] cursor-pointer">언제든 해지할 수 있나요?</summary>
          <p className="text-[13px] mt-2" style={{ color: "var(--text-2)" }}>
            네. 프로필 → Premium 관리에서 한 번에 해지. 다음 결제일까지는 그대로 사용 가능합니다.
          </p>
        </details>
        <details className="rounded-2xl p-4 mt-2" style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}>
          <summary className="font-bold text-[14px] cursor-pointer">결제 수단은 뭐가 있나요?</summary>
          <p className="text-[13px] mt-2" style={{ color: "var(--text-2)" }}>
            현재는 카카오페이. 네이버페이·토스는 곧 추가 예정이에요.
          </p>
        </details>
        <details className="rounded-2xl p-4 mt-2" style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}>
          <summary className="font-bold text-[14px] cursor-pointer">환불 정책은?</summary>
          <p className="text-[13px] mt-2" style={{ color: "var(--text-2)" }}>
            서비스 결함 발생 시 잔여 기간 비례 환불. 단순 변심 환불은 결제 후 7일 이내 사용 이력이 없는 경우에 한해 가능합니다.
          </p>
        </details>
      </section>

      <div className="mt-10 text-center">
        <Link href="/profile" className="text-[12px]" style={{ color: "var(--text-3)" }}>
          다음에 살펴볼게요
        </Link>
      </div>
    </div>
  );
}

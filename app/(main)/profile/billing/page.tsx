// Premium status + manage page.
// Shown when the user is premium (active/trialing/past_due). Otherwise we
// redirect to /billing/upgrade.

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPremiumStatus } from "@/lib/premium";
import { LargeTitle } from "@/components/ui/LargeTitle";
import CancelSubscriptionButton from "@/components/billing/CancelSubscriptionButton";

export const dynamic = "force-dynamic";

const STATUS_LABEL = {
  trialing: { tone: "var(--accent)", label: "무료 체험 중" },
  active: { tone: "var(--accent)", label: "활성" },
  past_due: { tone: "#D14343", label: "결제 실패 — 카드 확인 필요" },
} as const;

const PLAN_LABEL: Record<string, string> = {
  "premium-monthly": "월간 (4,900원/월)",
  "premium-yearly": "연간 (39,000원/년)",
};

function fmt(d: string) {
  try {
    const dt = new Date(d);
    return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, "0")}.${String(dt.getDate()).padStart(2, "0")}`;
  } catch {
    return d;
  }
}

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const status = await getPremiumStatus(supabase, user.id);
  if (!status) redirect("/billing/upgrade");

  const meta = STATUS_LABEL[status.status];

  return (
    <div className="pb-24">
      <LargeTitle eyebrow="Premium" title="구독 관리" />

      <div className="px-[18px] mt-2 space-y-4">
        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-2)" }}>
            상태
          </div>
          <div className="font-display text-[22px] font-extrabold mt-1" style={{ color: meta.tone }}>
            {meta.label}
          </div>
          <div className="mt-2 text-[14px]">
            <span style={{ color: "var(--text-2)" }}>플랜:</span>{" "}
            <strong>{PLAN_LABEL[status.plan] ?? status.plan}</strong>
          </div>
          <div className="text-[14px] mt-1">
            <span style={{ color: "var(--text-2)" }}>
              {status.status === "trialing" ? "체험 종료" : "다음 결제일"}:
            </span>{" "}
            <strong>{fmt(status.until)}</strong>
          </div>
        </div>

        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
        >
          <div className="font-display text-[15px] font-extrabold mb-2">사용 중인 기능</div>
          <ul className="text-[13.5px] space-y-1.5" style={{ color: "var(--text-2)" }}>
            <li>· AI Discover·블로그 후기·메뉴 추출 하루 50회</li>
            <li>· 친구 follow + 활동 피드</li>
            <li>· 월간 미식 리포트</li>
            <li>· 고급 통계</li>
          </ul>
        </div>

        <CancelSubscriptionButton />

        <div className="text-center pt-2">
          <Link href="/profile" className="text-[12px]" style={{ color: "var(--text-3)" }}>
            ← 프로필로
          </Link>
        </div>
      </div>
    </div>
  );
}

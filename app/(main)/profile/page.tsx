// app/(main)/profile/page.tsx — v3
// Data + all interactive children (Stats, AIInsights, ThemeToggle, InstallButton,
// BugReportButton, LogoutButton, DeleteAccountButton) unchanged. Re-skinned:
// identity card, serif section headers, consistent v3 surfaces.

import Link from "next/link";
import { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/ui/LogoutButton";
import InstallButton from "@/components/ui/InstallButton";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Stats from "@/components/profile/Stats";
import AIInsights from "@/components/profile/AIInsights";
import BugReportButton from "@/components/profile/BugReportButton";
import DeleteAccountButton from "@/components/profile/DeleteAccountButton";
import { LargeTitle } from "@/components/ui/LargeTitle";
import { Group, ListRow } from "@/components/ui/Group";
import { submitBugReport } from "./bug-action";
import { deleteAccount } from "./account-action";

function Sec({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="px-[18px] pt-6">
      <h2 className="font-display text-[18px] font-extrabold mb-2.5 px-0.5">{title}</h2>
      {children}
    </section>
  );
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: restaurants }, { data: visits }] = await Promise.all([
    supabase
      .from("restaurants")
      .select("id, name, category, rating, is_favorite")
      .eq("user_id", user!.id),
    supabase
      .from("visits")
      .select("visited_at, restaurant_id")
      .eq("user_id", user!.id),
  ]);

  const email = user?.email ?? "";
  const initial = (email[0] ?? "나").toUpperCase();

  return (
    <>
      <div style={{ height: 48 }} />
      <LargeTitle title="프로필" />

      {/* Identity card */}
      <div className="px-[18px]">
        <div
          className="flex items-center gap-[15px] p-[18px]"
          style={{ borderRadius: "var(--r-card)", background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
        >
          <div
            className="flex items-center justify-center text-white shrink-0 font-display"
            style={{
              width: 60, height: 60, borderRadius: 999, fontSize: 24, fontWeight: 900,
              background: "linear-gradient(150deg, var(--accent), var(--accent-press))",
            }}
          >
            {initial}
          </div>
          <div className="min-w-0">
            <div className="font-display text-[19px] font-extrabold truncate">
              {email ? email.split("@")[0] : "맛집 탐험가"}
            </div>
            <div className="text-[13px] truncate" style={{ color: "var(--text-2)" }}>{email || "—"}</div>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <Stats restaurants={restaurants ?? []} visits={visits ?? []} />
      </div>

      <div className="pt-1">
        <AIInsights hasVisits={(visits?.length ?? 0) > 0} />
      </div>

      <Sec title="나의 큐레이션">
        <Group>
          <Link href="/collections" className="flex items-center justify-between px-4 h-[52px]">
            <span className="text-[15px]">컬렉션</span>
            <span style={{ color: "var(--text-3)", fontSize: 16 }}>›</span>
          </Link>
        </Group>
      </Sec>

      <Sec title="테마">
        <ThemeToggle />
      </Sec>

      <Sec title="앱">
        <InstallButton />
      </Sec>

      <Sec title="도움말">
        <BugReportButton submit={submitBugReport} />
      </Sec>

      <Sec title="약관 및 정책">
        <Group>
          <Link href="/legal/terms" className="flex items-center justify-between px-4 h-[52px]">
            <span className="text-[15px]">이용약관</span>
            <span style={{ color: "var(--text-3)", fontSize: 16 }}>›</span>
          </Link>
          <Link href="/legal/privacy" className="flex items-center justify-between px-4 h-[52px]" style={{ borderTop: "0.5px solid var(--separator)" }}>
            <span className="text-[15px]">개인정보처리방침</span>
            <span style={{ color: "var(--text-3)", fontSize: 16 }}>›</span>
          </Link>
        </Group>
      </Sec>

      <Sec title="계정">
        <Group>
          <ListRow icon="person" label="이메일" detail={email || "—"} />
        </Group>
        <div className="mt-2">
          <LogoutButton />
        </div>
        <div className="mt-1">
          <DeleteAccountButton deleteAccount={deleteAccount} />
        </div>
      </Sec>

      <div style={{ height: 8 }} />
    </>
  );
}

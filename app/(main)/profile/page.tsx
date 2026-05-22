import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/ui/LogoutButton";
import InstallButton from "@/components/ui/InstallButton";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Stats from "@/components/profile/Stats";
import AIInsights from "@/components/profile/AIInsights";
import BugReportButton from "@/components/profile/BugReportButton";
import DeleteAccountButton from "@/components/profile/DeleteAccountButton";
import { LargeTitle } from "@/components/ui/LargeTitle";
import { SectionHeader, Group, ListRow } from "@/components/ui/Group";
import { submitBugReport } from "./bug-action";
import { deleteAccount } from "./account-action";

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

  return (
    <>
      <div style={{ height: 48 }} />
      <LargeTitle title="프로필" meta={user?.email ?? undefined} />

      <Stats restaurants={restaurants ?? []} visits={visits ?? []} />

      <AIInsights hasVisits={(visits?.length ?? 0) > 0} />

      <section className="px-4 pt-5">
        <SectionHeader>테마</SectionHeader>
        <ThemeToggle />
      </section>

      <section className="px-4 pt-5">
        <SectionHeader>계정</SectionHeader>
        <Group>
          <ListRow icon="person" label="이메일" detail={user?.email ?? "—"} />
        </Group>
      </section>

      <section className="px-4 pt-5">
        <SectionHeader>도움말</SectionHeader>
        <BugReportButton submit={submitBugReport} />
      </section>

      <section className="px-4 pt-5">
        <SectionHeader>약관 및 정책</SectionHeader>
        <Group>
          <Link
            href="/legal/terms"
            className="flex items-center justify-between px-4 h-12"
          >
            <span className="text-[15px]">이용약관</span>
            <span style={{ color: "var(--text-3)", fontSize: 16 }}>›</span>
          </Link>
          <Link
            href="/legal/privacy"
            className="flex items-center justify-between px-4 h-12"
            style={{ borderTop: "1px solid var(--separator)" }}
          >
            <span className="text-[15px]">개인정보처리방침</span>
            <span style={{ color: "var(--text-3)", fontSize: 16 }}>›</span>
          </Link>
        </Group>
      </section>

      <section className="px-4 pt-5 space-y-2">
        <InstallButton />
        <LogoutButton />
      </section>

      <section className="px-4 pt-3">
        <DeleteAccountButton deleteAccount={deleteAccount} />
      </section>
    </>
  );
}

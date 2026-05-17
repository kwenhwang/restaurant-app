import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/ui/LogoutButton";
import InstallButton from "@/components/ui/InstallButton";
import { LargeTitle } from "@/components/ui/LargeTitle";
import { SectionHeader, Group, ListRow } from "@/components/ui/Group";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { count: restaurantCount } = await supabase
    .from("restaurants")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id);

  const { count: visitCount } = await supabase
    .from("visits")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id);

  return (
    <>
      <div style={{ height: 48 }} />
      <LargeTitle title="프로필" meta={user?.email ?? undefined} />

      {/* Stats */}
      <div className="px-4 pb-1">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="기록한 맛집" value={restaurantCount ?? 0} />
          <Stat label="방문 횟수" value={visitCount ?? 0} />
        </div>
      </div>

      <section className="px-4">
        <SectionHeader>계정</SectionHeader>
        <Group>
          <ListRow
            icon="person"
            label="이메일"
            detail={user?.email ?? "—"}
          />
        </Group>
      </section>

      <section className="px-4 pt-5 space-y-2">
        <InstallButton />
        <LogoutButton />
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded-[18px] p-4 bg-white"
      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
    >
      <div className="text-[12px] font-semibold" style={{ color: "var(--text-2)" }}>
        {label}
      </div>
      <div
        className="text-[32px] font-extrabold mt-1 leading-none"
        style={{ letterSpacing: "-0.8px" }}
      >
        {value}
      </div>
    </div>
  );
}

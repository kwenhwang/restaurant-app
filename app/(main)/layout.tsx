import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/ui/LogoutButton";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-orange-500">
            맛집 기록장
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/map" className="text-sm text-gray-600 hover:text-gray-900">지도</Link>
            <Link href="/visits" className="text-sm text-gray-600 hover:text-gray-900">방문 기록</Link>
            <span className="text-xs text-gray-400">{user?.email}</span>
            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}

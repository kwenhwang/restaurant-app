import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function VisitsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: visits } = await supabase
    .from("visits")
    .select("*, restaurant:restaurants(id, name, category)")
    .eq("user_id", user!.id)
    .order("visited_at", { ascending: false });

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">방문 기록 ({visits?.length ?? 0})</h2>

      {visits && visits.length > 0 ? (
        <div className="space-y-2">
          {visits.map((v) => (
            <Link key={v.id} href={`/restaurants/${v.restaurant_id}`}>
              <div className="bg-white rounded-xl border border-gray-100 hover:border-orange-200 px-4 py-3 flex items-center gap-4 transition-all">
                <div className="text-sm text-gray-400 w-20 flex-shrink-0">{v.visited_at}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{v.restaurant?.name}</p>
                  {v.memo && <p className="text-xs text-gray-500 truncate">{v.memo}</p>}
                </div>
                {v.restaurant?.category && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded flex-shrink-0">
                    {v.restaurant.category}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-sm">방문 기록이 없어요</p>
        </div>
      )}
    </div>
  );
}

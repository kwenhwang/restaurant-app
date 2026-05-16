import { createClient } from "@/lib/supabase/server";
import KakaoMap from "@/components/map/KakaoMap";

export default async function MapPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id, name, address, lat, lng, category, rating")
    .eq("user_id", user!.id)
    .not("lat", "is", null);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">지도</h2>
      <KakaoMap restaurants={restaurants ?? []} />
    </div>
  );
}

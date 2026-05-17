import { createClient } from "@/lib/supabase/server";
import KakaoMap from "@/components/map/KakaoMap";
import { LargeTitle } from "@/components/ui/LargeTitle";

export default async function MapPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id, name, address, lat, lng, category, rating")
    .eq("user_id", user!.id)
    .not("lat", "is", null);

  const mapped = restaurants?.length ?? 0;

  return (
    <>
      <div style={{ height: 48 }} />
      <LargeTitle title="지도" meta={`주소가 등록된 ${mapped}곳을 보여드려요`} />

      <div className="px-4">
        <div
          className="rounded-[20px] overflow-hidden"
          style={{
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.04), 0 12px 28px rgba(0,0,0,0.04)",
            height: "calc(100vh - 280px)",
            minHeight: 420,
          }}
        >
          <KakaoMap restaurants={restaurants ?? []} />
        </div>
      </div>
    </>
  );
}

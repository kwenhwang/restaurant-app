import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import KakaoMap from "@/components/map/KakaoMap";
import { LargeTitle } from "@/components/ui/LargeTitle";
import Sym from "@/components/ui/Sym";

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

      {mapped === 0 ? (
        <div className="flex flex-col items-center text-center py-20 px-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            <Sym name="mappin.and.ellipse" size={28} />
          </div>
          <h2 className="text-[17px] font-bold">지도에 표시할 맛집이 없어요</h2>
          <p
            className="text-[14px] mt-1.5 max-w-[280px]"
            style={{ color: "var(--text-2)" }}
          >
            맛집을 추가할 때 주소를 입력하거나, 지도에서 위치를 지정해 주세요.
          </p>
          <Link
            href="/restaurants/new"
            className="mt-6 inline-flex items-center gap-1.5 h-11 px-5 rounded-full text-[15px] font-semibold text-white"
            style={{ background: "var(--accent)" }}
          >
            <Sym name="plus" size={16} strokeWidth={2.4} />
            맛집 추가
          </Link>
        </div>
      ) : (
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
      )}
    </>
  );
}

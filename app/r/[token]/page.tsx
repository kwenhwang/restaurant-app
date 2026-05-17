import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import Stars from "@/components/ui/Stars";
import { SectionHeader, Group, ListRow } from "@/components/ui/Group";
import Sym from "@/components/ui/Sym";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const sb = createAdminClient();
  const { data: r } = await sb
    .from("restaurants")
    .select("name, note")
    .eq("share_token", token)
    .single();
  return {
    title: r ? `${r.name} | 맛집 기록장` : "맛집",
    description: r?.note ?? "맛집 기록장에서 공유된 맛집",
  };
}

export default async function SharedRestaurantPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const sb = createAdminClient();

  const { data: restaurant } = await sb
    .from("restaurants")
    .select(
      "id, name, address, lat, lng, category, rating, note, images:restaurant_images(id, storage_path, is_primary)"
    )
    .eq("share_token", token)
    .single();

  if (!restaurant) notFound();

  const primary =
    restaurant.images?.find((i: { is_primary?: boolean }) => i.is_primary) ??
    restaurant.images?.[0];

  return (
    <article className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Hero */}
      <div className="relative">
        {primary ? (
          <div className="relative w-full h-[300px] bg-stripe">
            <Image
              src={`${IMAGE_BASE}/${primary.storage_path}`}
              alt={restaurant.name}
              fill
              sizes="(max-width: 768px) 100vw, 640px"
              priority
              className="object-cover"
            />
          </div>
        ) : (
          <div
            className="w-full h-[260px] bg-stripe"
            style={{
              background:
                "linear-gradient(135deg, hsl(22 70% 76%), hsl(46 65% 58%))",
            }}
          />
        )}
      </div>

      {/* Header */}
      <section
        className="relative px-5 pt-5 pb-2"
        style={{
          background: "var(--bg)",
          marginTop: -20,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
      >
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--accent)" }}>
          공유된 맛집
        </div>
        <h1 className="text-[28px] font-extrabold" style={{ letterSpacing: "-0.6px" }}>
          {restaurant.name}
        </h1>
        <div className="flex items-center gap-2 mt-1.5">
          {restaurant.rating && (
            <>
              <Stars value={restaurant.rating} size={14} />
              <span className="text-[13px]" style={{ color: "var(--text-2)" }}>
                {restaurant.rating}.0
              </span>
            </>
          )}
          {restaurant.category && (
            <span className="text-[13px]" style={{ color: "var(--text-2)" }}>
              · {restaurant.category}
            </span>
          )}
        </div>

        {restaurant.lat && restaurant.lng && (
          <a
            href={`https://map.kakao.com/link/to/${encodeURIComponent(restaurant.name)},${restaurant.lat},${restaurant.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 h-11 px-5 rounded-full text-[14px] font-semibold text-white"
            style={{ background: "var(--accent)" }}
          >
            <Sym name="mappin.and.ellipse" size={15} />
            카카오맵에서 길찾기
          </a>
        )}
      </section>

      {/* Photos */}
      {restaurant.images && restaurant.images.length > 1 && (
        <section className="px-4 pt-2">
          <SectionHeader>사진</SectionHeader>
          <div className="grid grid-cols-3 gap-1.5">
            {restaurant.images.map((img: { id: string; storage_path: string }) => (
              <div
                key={img.id}
                className="relative aspect-square rounded-xl overflow-hidden"
                style={{ background: "var(--bg)" }}
              >
                <Image
                  src={`${IMAGE_BASE}/${img.storage_path}`}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 33vw, 200px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Info */}
      <section className="px-4 pt-2">
        <SectionHeader>정보</SectionHeader>
        <Group>
          {restaurant.address && (
            <ListRow icon="mappin" label={restaurant.address} />
          )}
          {restaurant.category && (
            <ListRow icon="fork.knife" label={restaurant.category} />
          )}
        </Group>
      </section>

      {/* Memo */}
      {restaurant.note && (
        <section className="px-4 pt-2">
          <SectionHeader>메모</SectionHeader>
          <div
            className="rounded-2xl p-4 text-[15px] leading-relaxed bg-white"
            style={{ letterSpacing: "-0.2px" }}
          >
            <div
              className="text-[28px] mb-2"
              style={{ color: "var(--accent)", lineHeight: 0.5 }}
            >
              “
            </div>
            {restaurant.note}
          </div>
        </section>
      )}

      {/* Footer CTA */}
      <section className="px-4 pt-6 pb-8 text-center">
        <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
          나도 나만의 맛집 지도를 만들고 싶다면
        </p>
        <Link
          href="/signup"
          className="mt-2 inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[13px] font-semibold"
          style={{ background: "var(--bg)", color: "var(--accent)" }}
        >
          맛집 기록장 시작하기 →
        </Link>
      </section>
    </article>
  );
}

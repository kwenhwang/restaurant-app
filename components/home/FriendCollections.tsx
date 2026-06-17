import Link from "next/link";
import Sym from "@/components/ui/Sym";

interface Item {
  id: string;
  name: string;
  description: string | null;
  cover_image: string | null;
  item_count: number;
  share_token: string | null;
  updated_at: string;
}

interface Props {
  items: Item[];
}

export default function FriendCollections({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="px-[18px] mt-7">
      <div className="flex items-end justify-between mb-2.5 px-0.5">
        <h2 className="font-display text-[18px] font-extrabold flex items-center gap-1.5">
          <span style={{ color: "var(--accent)" }}>
            <Sym name="person.fill" size={16} />
          </span>
          친구의 컬렉션
        </h2>
        <Link href="/collections" className="text-[12px] font-bold" style={{ color: "var(--text-2)" }}>
          내 컬렉션 →
        </Link>
      </div>
      <div
        className="flex gap-3 -mx-[18px] px-[18px] overflow-x-auto pb-2"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {items.map((c) => {
          const href = c.share_token ? `/c/${c.share_token}` : `/collections/${c.id}`;
          return (
            <Link
              key={c.id}
              href={href}
              className="shrink-0 relative aspect-[3/4] rounded-2xl overflow-hidden"
              style={{
                width: 156,
                scrollSnapAlign: "start",
                boxShadow: "var(--shadow-1)",
              }}
            >
              {c.cover_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.cover_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(160deg, var(--accent-soft) 0%, var(--accent-2-soft) 100%)",
                  }}
                />
              )}
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.55) 100%)" }}
              />
              <div className="absolute bottom-0 left-0 right-0 p-2.5 text-white">
                <div className="font-display text-[14px] font-extrabold leading-tight line-clamp-2">
                  {c.name}
                </div>
                <div className="text-[10px] mt-1 opacity-90 tabular-nums">{c.item_count}곳</div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

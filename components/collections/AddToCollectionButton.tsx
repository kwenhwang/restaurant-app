"use client";

import { useEffect, useState, useTransition } from "react";
import Sym from "@/components/ui/Sym";
import { addToCollection } from "@/app/(main)/collections/actions";

interface MiniCollection {
  id: string;
  name: string;
  item_count: number;
  is_public: boolean;
}

interface Props {
  restaurantId: string;
}

export default function AddToCollectionButton({ restaurantId }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState<MiniCollection[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || collections.length > 0) return;
    setLoading(true);
    fetch(`/api/collections/list?restaurantId=${encodeURIComponent(restaurantId)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        setCollections(j.collections ?? []);
        setAddedIds(new Set<string>(j.alreadyIn ?? []));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, collections.length]);

  function handleAdd(collectionId: string) {
    if (addedIds.has(collectionId)) return;
    startTransition(async () => {
      const res = await addToCollection(collectionId, restaurantId);
      if (res.ok) {
        setAddedIds((prev) => new Set(prev).add(collectionId));
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-11 px-3 rounded-2xl inline-flex flex-col items-center justify-center gap-0.5 transition-transform active:scale-95"
        style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
      >
        <Sym name="bookmark.fill" size={16} />
        <span className="text-[10px] font-bold">컬렉션</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-[520px] rounded-t-3xl p-4 pb-8"
            style={{ background: "var(--bg)", maxHeight: "70vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-[19px] font-extrabold">컬렉션에 담기</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "var(--surface)" }}
                aria-label="닫기"
              >
                <Sym name="xmark" size={16} />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-6 text-[13px]" style={{ color: "var(--text-2)" }}>
                불러오는 중…
              </div>
            ) : collections.length === 0 ? (
              <div
                className="rounded-2xl p-5 text-center"
                style={{ background: "var(--surface)" }}
              >
                <p className="text-[14px]" style={{ color: "var(--text-2)" }}>
                  아직 컬렉션이 없어요.
                </p>
                <a
                  href="/collections/new"
                  className="mt-3 inline-flex h-10 px-4 rounded-full text-[13px] font-bold text-white"
                  style={{ background: "var(--accent)" }}
                >
                  새 컬렉션 만들기
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                {collections.map((c) => {
                  const added = addedIds.has(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      disabled={pending || added}
                      onClick={() => handleAdd(c.id)}
                      className="w-full text-left rounded-2xl px-4 py-3 flex items-center justify-between transition-transform active:scale-[0.98]"
                      style={{
                        background: added ? "var(--accent-soft)" : "var(--surface)",
                        boxShadow: "var(--shadow-1)",
                      }}
                    >
                      <div className="min-w-0">
                        <div className="font-display text-[15px] font-bold truncate">{c.name}</div>
                        <div className="text-[11px]" style={{ color: "var(--text-2)" }}>
                          {c.item_count}곳 {c.is_public && "· 공개"}
                        </div>
                      </div>
                      {added ? (
                        <span
                          className="inline-flex items-center gap-1 text-[12px] font-bold"
                          style={{ color: "var(--accent)" }}
                        >
                          <Sym name="checkmark" size={14} strokeWidth={2.6} /> 담김
                        </span>
                      ) : (
                        <span className="text-[12px] font-bold" style={{ color: "var(--accent)" }}>
                          담기
                        </span>
                      )}
                    </button>
                  );
                })}

                <a
                  href="/collections/new"
                  className="block text-center mt-3 h-11 leading-[44px] rounded-2xl text-[13px] font-bold"
                  style={{ background: "var(--surface)", color: "var(--text-2)" }}
                >
                  + 새 컬렉션 만들기
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

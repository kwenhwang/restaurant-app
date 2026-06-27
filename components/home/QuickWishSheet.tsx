"use client";

// Quick-save sheet for "가고 싶은 곳" — type a name, pick from Kakao
// keyword-search results, save in one tap. No photo, no rating, no GPS
// required (uses Kakao's coords from the result).

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Sym from "@/components/ui/Sym";
import { categoryStyle } from "@/lib/category-icons";
import { haptic } from "@/lib/haptic";

interface KakaoResult {
  name: string;
  address: string;
  category: string;
  lat: number;
  lng: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_MAP: Record<string, string> = {
  한식: "한식",
  중식: "중식",
  일식: "일식",
  양식: "양식",
  카페: "카페",
  주점: "술집",
  술집: "술집",
  베이커리: "디저트",
  디저트: "디저트",
};

function mapCategory(raw: string): string {
  const parts = raw.split(">").map((s) => s.trim());
  for (let i = parts.length - 1; i >= 0; i--) {
    const key = Object.keys(CATEGORY_MAP).find((k) => parts[i].includes(k));
    if (key) return CATEGORY_MAP[key];
  }
  return "기타";
}

export default function QuickWishSheet({ open, onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KakaoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ name: string; collectionId: string | null } | null>(null);

  // Focus input on open + reset state on close
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 120);
    } else {
      setQuery("");
      setResults([]);
      setError(null);
      setDone(null);
    }
  }, [open]);

  // Debounced Kakao search
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/kakao/keyword?query=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error("검색 실패");
        const json = await res.json();
        const raw = (json.results ?? []) as {
          name: string;
          address: string;
          category: string;
          lat: number;
          lng: number;
        }[];
        setResults(raw.slice(0, 8));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [query, open]);

  async function save(r: KakaoResult) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/wish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: r.name,
          address: r.address,
          lat: r.lat,
          lng: r.lng,
          category: mapCategory(r.category),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "저장 실패");
      haptic("success");
      setDone({ name: r.name, collectionId: json.collectionId ?? null });
      router.refresh();
    } catch (e) {
      haptic("error");
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setSaving(false);
    }
  }

  async function saveManual() {
    const q = query.trim();
    if (!q) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/wish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: q }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "저장 실패");
      haptic("success");
      setDone({ name: q, collectionId: json.collectionId ?? null });
      router.refresh();
    } catch (e) {
      haptic("error");
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
      style={{ background: "rgba(0,0,0,0.42)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-3"
        style={{ background: "var(--surface)", maxHeight: "82vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-[19px] font-extrabold">아직 안 간 곳 찜하기</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "var(--bg)" }}
          >
            <Sym name="xmark" size={16} />
          </button>
        </div>

        {done ? (
          <div className="space-y-3 py-4 text-center">
            <div className="text-[44px]">✨</div>
            <p className="font-display text-[16px] font-extrabold">
              {done.name} <span style={{ color: "var(--text-2)" }}>· 찜 완료</span>
            </p>
            <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
              나중에 그 동네 가면 알려드릴게요.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDone(null);
                  setQuery("");
                  setResults([]);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className="flex-1 h-11 rounded-full text-[14px] font-bold"
                style={{ background: "var(--bg)", color: "var(--text)" }}
              >
                또 찜하기
              </button>
              {done.collectionId && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(`/collections/${done.collectionId}`);
                  }}
                  className="flex-1 h-11 rounded-full text-[14px] font-bold text-white"
                  style={{ background: "var(--accent)" }}
                >
                  찜 목록 보기
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div
              className="rounded-2xl px-4 py-2.5"
              style={{ background: "var(--bg)" }}
            >
              <div
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-2)" }}
              >
                가게 이름
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="예: 노랑통닭 강남점"
                className="w-full bg-transparent outline-none text-[16px] mt-0.5"
                style={{ color: "var(--text)" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && results[0]) save(results[0]);
                }}
              />
            </div>

            {error && (
              <p className="text-[12px] px-1" style={{ color: "var(--error)" }}>
                ⚠️ {error}
              </p>
            )}

            {query.trim().length < 2 ? (
              <p className="text-[12px] px-1" style={{ color: "var(--text-3)" }}>
                2글자 이상 입력하면 카카오에서 검색해 줘요.
              </p>
            ) : searching && results.length === 0 ? (
              <p className="text-[12px] px-1" style={{ color: "var(--text-3)" }}>
                검색 중…
              </p>
            ) : results.length === 0 ? (
              <div className="text-[13px] space-y-2" style={{ color: "var(--text-2)" }}>
                <p className="px-1">검색 결과가 없어요.</p>
                <button
                  type="button"
                  onClick={saveManual}
                  disabled={saving}
                  className="w-full h-11 rounded-full text-[13px] font-bold"
                  style={{ background: "var(--accent-soft)", color: "var(--accent-press)" }}
                >
                  {saving ? "저장 중…" : `"${query.trim()}" 그대로 찜하기`}
                </button>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {results.map((r, i) => {
                  const cat = mapCategory(r.category);
                  const s = categoryStyle(cat);
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => save(r)}
                        disabled={saving}
                        className="w-full text-left rounded-2xl px-3.5 py-3 flex items-center gap-3 transition-transform active:scale-[0.98] disabled:opacity-60"
                        style={{ background: "var(--bg)" }}
                      >
                        <span
                          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-[22px]"
                          style={{ background: s.gradient }}
                        >
                          {s.emoji}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-display text-[15px] font-extrabold truncate">
                            {r.name}
                          </div>
                          <div
                            className="text-[12px] truncate"
                            style={{ color: "var(--text-2)" }}
                          >
                            {cat} · {r.address}
                          </div>
                        </div>
                        <Sym name="plus" size={16} strokeWidth={2.6} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Parsed {
  name: string | null;
  address: string | null;
  category: string | null;
  rating: number | null;
}

export default function ShareReceiveClient({ initialText }: { initialText: string }) {
  const router = useRouter();
  const [text, setText] = useState(initialText);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialText) parseShare(initialText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function parseShare(t: string) {
    if (!t.trim()) return;
    setParsing(true);
    setError(null);
    try {
      // Extract URLs from text, fetch first one if it's a place URL we can scrape
      const urlMatch = t.match(/https?:\/\/[^\s]+/);
      let extracted: { name?: string; address?: string } = {};
      if (urlMatch) {
        try {
          // Try a HEAD fetch to follow short URLs (kakao map share URLs)
          // We can't easily fetch from the client due to CORS, so just send to parser
        } catch {}
      }

      // Send to AI parser
      const res = await fetch("/api/ai/parse-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t, ...extracted }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setParsed(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석 실패");
    } finally {
      setParsing(false);
    }
  }

  async function save() {
    if (!parsed?.name) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      // Try geocoding if we have address
      let lat: number | null = null;
      let lng: number | null = null;
      if (parsed.address) {
        try {
          const geoRes = await fetch(
            `/api/kakao/address?query=${encodeURIComponent(parsed.address)}`
          );
          if (geoRes.ok) {
            const g = await geoRes.json();
            if (g.lat && g.lng) {
              lat = parseFloat(g.lat);
              lng = parseFloat(g.lng);
            }
          }
        } catch {}
      }

      const { data, error: insertErr } = await supabase
        .from("restaurants")
        .insert({
          user_id: user.id,
          name: parsed.name,
          address: parsed.address,
          lat,
          lng,
          category: parsed.category,
          rating: parsed.rating,
          note: null,
        })
        .select("id")
        .single();
      if (insertErr || !data) throw new Error(insertErr?.message ?? "create failed");

      router.push(`/restaurants/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
      setSaving(false);
    }
  }

  async function wish() {
    if (!parsed?.name) return;
    setSaving(true);
    setError(null);
    try {
      let lat: number | null = null;
      let lng: number | null = null;
      if (parsed.address) {
        try {
          const geoRes = await fetch(
            `/api/kakao/address?query=${encodeURIComponent(parsed.address)}`,
          );
          if (geoRes.ok) {
            const g = await geoRes.json();
            if (g.lat && g.lng) {
              lat = parseFloat(g.lat);
              lng = parseFloat(g.lng);
            }
          }
        } catch {}
      }

      const res = await fetch("/api/wish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parsed.name,
          address: parsed.address,
          lat,
          lng,
          category: parsed.category,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "찜 저장 실패");
      router.push(json.collectionId ? `/collections/${json.collectionId}` : "/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
        <Link href="/" className="text-[15px]" style={{ color: "var(--text-2)" }}>
          취소
        </Link>
        <span className="text-[17px] font-bold" style={{ letterSpacing: "-0.3px" }}>
          공유받은 가게
        </span>
        <span style={{ width: 36 }} />
      </header>

      <div className="px-4 flex-1">
        <div className="rounded-2xl p-3.5" style={{ background: "var(--bg)" }}>
          <div
            className="text-[11px] font-semibold uppercase tracking-wider mb-1"
            style={{ color: "var(--text-2)" }}
          >
            공유된 내용
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full bg-transparent outline-none text-[14px] resize-none"
            placeholder="외부 앱에서 공유한 내용이 여기 들어와요"
          />
          <button
            type="button"
            onClick={() => parseShare(text)}
            disabled={parsing || !text.trim()}
            className="mt-2 h-9 px-4 rounded-xl text-[13px] font-bold text-white disabled:opacity-50"
            style={{ background: "var(--accent)" }}
          >
            {parsing ? "분석 중…" : "AI로 분석"}
          </button>
        </div>

        {parsed && (
          <div
            className="mt-4 rounded-2xl p-4 bg-white"
            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
          >
            <div
              className="text-[11px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--accent)" }}
            >
              ✨ 분석 결과
            </div>
            <Field label="이름" value={parsed.name ?? "—"} />
            <Field label="주소" value={parsed.address ?? "—"} />
            <Field label="카테고리" value={parsed.category ?? "—"} />
            <Field
              label="평점"
              value={parsed.rating ? "★".repeat(parsed.rating) : "—"}
            />
          </div>
        )}

        {error && (
          <div className="mt-3 text-[13px]" style={{ color: "#FF3B30" }}>
            {error}
          </div>
        )}
      </div>

      {parsed?.name && (
        <div
          className="fixed bottom-0 left-0 right-0 z-30 px-4 pt-3 pb-6 space-y-2"
          style={{
            background: "linear-gradient(to top, var(--bg) 0%, var(--bg) 70%, transparent 100%)",
          }}
        >
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="w-full h-[54px] rounded-2xl text-white text-[17px] font-bold disabled:opacity-50"
            style={{ background: "var(--accent)", boxShadow: "0 8px 20px rgba(255,111,61,0.28)" }}
          >
            {saving ? "저장 중…" : "맛집으로 추가 (가봤어요)"}
          </button>
          <button
            type="button"
            onClick={wish}
            disabled={saving}
            className="w-full h-[48px] rounded-2xl text-[15px] font-bold disabled:opacity-50"
            style={{ background: "var(--accent-soft)", color: "var(--accent-press)" }}
          >
            🔖 찜만 (다음에 갈게요)
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2" style={{ borderTop: "1px solid var(--separator)" }}>
      <span className="text-[13px]" style={{ color: "var(--text-2)" }}>
        {label}
      </span>
      <span className="text-[14px] font-semibold text-right">{value}</span>
    </div>
  );
}

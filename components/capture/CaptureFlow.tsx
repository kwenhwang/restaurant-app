"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { categoryStyle } from "@/lib/category-icons";
import { getLocationConsent } from "@/lib/location-consent";
import LocationConsent from "@/components/ui/LocationConsent";
import VoiceInput from "./VoiceInput";

interface NearbyKakao {
  kakaoId: string;
  name: string;
  address: string;
  category: string;
  lat: number;
  lng: number;
  distance: number;
}

interface NearbyMine {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  category: string | null;
  rating: number | null;
  distance: number;
  images?: { id: string; storage_path: string; is_primary?: boolean }[];
}

interface Analysis {
  category: string;
  confidence: "high" | "medium" | "low";
  description: string;
  detected_items: string[];
}

type Picked =
  | { kind: "mine"; r: NearbyMine }
  | { kind: "kakao"; r: NearbyKakao }
  | { kind: "manual"; name: string };

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

export default function CaptureFlow() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [coord, setCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const [kakaoNearby, setKakaoNearby] = useState<NearbyKakao[]>([]);
  const [mineNearby, setMineNearby] = useState<NearbyMine[]>([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);

  const [picked, setPicked] = useState<Picked | null>(null);
  const [manualName, setManualName] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function requestGPS() {
    if (!navigator.geolocation) {
      setGeoError("이 브라우저는 위치 기능을 지원하지 않아요");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoord({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setGeoError(err.message === "User denied Geolocation" ? "위치 권한이 필요해요" : "위치를 가져올 수 없어요");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  // Request GPS only when user previously consented
  useEffect(() => {
    if (getLocationConsent() === "granted") {
      requestGPS();
    } else if (getLocationConsent() === "denied") {
      setGeoError("위치 권한이 꺼져 있어요");
    }
    // 'unknown' → LocationConsent modal will appear, then onDecision triggers GPS
  }, []);

  // Fetch nearby places once we have coord
  useEffect(() => {
    if (!coord) return;
    setSearchingPlaces(true);
    Promise.all([
      fetch(`/api/kakao/nearby?lat=${coord.lat}&lng=${coord.lng}&radius=200`).then((r) => r.json()),
      fetch(`/api/restaurants/nearby-mine?lat=${coord.lat}&lng=${coord.lng}&radius=300`).then((r) => r.json()),
    ])
      .then(([kakao, mine]) => {
        setKakaoNearby(kakao.results ?? []);
        setMineNearby(mine.results ?? []);
      })
      .finally(() => setSearchingPlaces(false));
  }, [coord]);

  function pickFile(f: File) {
    if (!f.type.startsWith("image/")) {
      alert("이미지 파일을 선택해 주세요");
      return;
    }
    setFile(f);
    const url = URL.createObjectURL(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(url);

    // Kick off AI analysis
    setAnalyzing(true);
    setAnalysis(null);
    const fd = new FormData();
    fd.append("file", f);
    fetch("/api/ai/analyze-blob", { method: "POST", body: fd })
      .then((r) => r.json())
      .then((res) => {
        if (res.category && res.confidence !== "low") setAnalysis(res);
      })
      .catch(() => {})
      .finally(() => setAnalyzing(false));
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) pickFile(f);
  }

  async function handleSave() {
    if (!picked) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      alert("로그인이 필요해요");
      return;
    }

    try {
      let restaurantId: string;

      if (picked.kind === "mine") {
        // Re-visit existing restaurant
        restaurantId = picked.r.id;
      } else {
        // New restaurant
        const name = picked.kind === "kakao" ? picked.r.name : picked.kind === "manual" ? picked.name : "";
        const insertPayload: {
          user_id: string;
          name: string;
          category: string | null;
          rating: number | null;
          note: string | null;
          address: string | null;
          lat: number | null;
          lng: number | null;
        } = {
          user_id: user.id,
          name,
          category:
            picked.kind === "kakao" ? picked.r.category : analysis?.category ?? null,
          rating,
          note: memo || (analysis?.description ?? null),
          address: picked.kind === "kakao" ? picked.r.address : null,
          lat:
            picked.kind === "kakao"
              ? picked.r.lat
              : coord?.lat ?? null,
          lng:
            picked.kind === "kakao"
              ? picked.r.lng
              : coord?.lng ?? null,
        };

        const { data: newRest, error: insertErr } = await supabase
          .from("restaurants")
          .insert(insertPayload)
          .select("id")
          .single();
        if (insertErr || !newRest) throw new Error(insertErr?.message ?? "create failed");
        restaurantId = newRest.id;
      }

      // Upload photo if we have one
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("restaurantId", restaurantId);
        await fetch("/api/upload", { method: "POST", body: fd });
      }

      // Always log a visit
      await supabase.from("visits").insert({
        user_id: user.id,
        restaurant_id: restaurantId,
        visited_at: todayLocalISO(),
        memo: memo || null,
      });

      // Fire-and-forget: auto-fetch menu in the background.
      // Only for new restaurants (not re-visits), and only if no menu yet.
      // keepalive: true ensures the request completes even if user navigates away.
      if (picked.kind !== "mine") {
        fetch("/api/ai/find-menu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restaurantId }),
          keepalive: true,
        }).catch(() => {});
      }

      router.push(`/restaurants/${restaurantId}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "저장 실패";
      alert(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <LocationConsent
        onDecision={(granted) => {
          if (granted) requestGPS();
          else setGeoError("위치 권한이 꺼져 있어요");
        }}
      />
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
        <Link
          href="/"
          className="text-[15px]"
          style={{ color: "var(--text-2)" }}
        >
          취소
        </Link>
        <span
          className="text-[17px] font-bold"
          style={{ letterSpacing: "-0.3px" }}
        >
          빠른 등록
        </span>
        <Link
          href="/restaurants/new"
          className="text-[12px] font-semibold"
          style={{ color: "var(--text-2)" }}
        >
          상세 입력
        </Link>
      </header>

      {/* Photo area */}
      <div className="px-4">
        {previewUrl ? (
          <div
            className="relative aspect-square rounded-2xl overflow-hidden"
            style={{ background: "var(--bg)" }}
          >
            <Image src={previewUrl} alt="" fill className="object-cover" sizes="100vw" unoptimized />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              aria-label="사진 바꾸기"
              className="absolute top-3 right-3 px-3 h-8 rounded-full text-[12px] font-semibold flex items-center"
              style={{ background: "rgba(0,0,0,0.55)", color: "white", backdropFilter: "blur(8px)" }}
            >
              사진 변경
            </button>
            {analyzing && (
              <div
                className="absolute bottom-3 left-3 right-3 rounded-2xl px-3 py-2 text-[13px] flex items-center gap-2"
                style={{ background: "rgba(0,0,0,0.55)", color: "white", backdropFilter: "blur(12px)" }}
              >
                <span>✨</span>
                <span>사진 분석 중…</span>
              </div>
            )}
            {analysis && !analyzing && (
              <div
                className="absolute bottom-3 left-3 right-3 rounded-2xl px-3 py-2 text-[13px]"
                style={{ background: "rgba(0,0,0,0.6)", color: "white", backdropFilter: "blur(12px)" }}
              >
                <span style={{ color: "#FFAA88" }}>✨ {analysis.category}</span>
                <span className="opacity-80 ml-1.5">· {analysis.description}</span>
              </div>
            )}
          </div>
        ) : (
          <PhotoPicker onPick={() => inputRef.current?.click()} />
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleInput}
          className="hidden"
        />
      </div>

      {/* Location status */}
      <div className="px-4 mt-3">
        <div
          className="rounded-2xl px-3 py-2.5 flex items-center gap-2 text-[13px]"
          style={{ background: "var(--bg)" }}
        >
          <span>📍</span>
          {locating ? (
            <span style={{ color: "var(--text-2)" }}>위치 확인 중…</span>
          ) : coord ? (
            <span style={{ color: "var(--text-2)" }}>
              {searchingPlaces
                ? "주변 가게 검색 중…"
                : `근처 ${kakaoNearby.length + mineNearby.length}곳 발견`}
            </span>
          ) : (
            <span style={{ color: "var(--text-2)" }}>{geoError ?? "위치를 켜주세요"}</span>
          )}
        </div>
      </div>

      {/* Voice input — show always so user can dictate */}
      <div className="px-4 mt-3">
        <VoiceInput
          onParsed={(parsed) => {
            if (parsed.name) {
              setManualName(parsed.name);
              setPicked({ kind: "manual", name: parsed.name });
            }
            if (parsed.rating) setRating(parsed.rating);
            if (parsed.memo) setMemo(parsed.memo);
            // category from voice will be applied at save time via analysis fallback;
            // we stash it into a fake analysis to feed into the save payload
            if (parsed.category && !analysis) {
              setAnalysis({
                category: parsed.category,
                confidence: "high",
                description: parsed.memo ?? "",
                detected_items: [],
              });
            }
          }}
        />
      </div>

      {/* Candidate list + manual entry + rating + memo always visible */}
      <div className="px-4 mt-3 space-y-2 flex-1 pb-32">
        {mineNearby.length > 0 && (
          <>
            <SectionLabel>이미 등록한 가게 (재방문)</SectionLabel>
            {mineNearby.map((r) => {
              const isPicked = picked?.kind === "mine" && picked.r.id === r.id;
              return (
                <Candidate
                  key={"mine-" + r.id}
                  title={r.name}
                  subtitle={`${r.distance.toFixed(0)}m · ${r.category ?? "?"}`}
                  badge="다시 방문"
                  selected={isPicked}
                  category={r.category}
                  onClick={() => setPicked({ kind: "mine", r })}
                  image={(() => {
                    const p = r.images?.find((i) => i.is_primary) ?? r.images?.[0];
                    return p ? `${IMAGE_BASE}/${p.storage_path}` : null;
                  })()}
                />
              );
            })}
          </>
        )}

        {kakaoNearby.length > 0 && (
          <>
            <SectionLabel>주변 가게</SectionLabel>
            {kakaoNearby.slice(0, 10).map((r) => {
              const isPicked = picked?.kind === "kakao" && picked.r.kakaoId === r.kakaoId;
              const alreadyMine = mineNearby.some(
                (m) => m.name === r.name && Math.abs((m.lat ?? 0) - r.lat) < 0.0005
              );
              if (alreadyMine) return null;
              return (
                <Candidate
                  key={"k-" + r.kakaoId}
                  title={r.name}
                  subtitle={`${r.distance}m · ${r.category}`}
                  selected={isPicked}
                  category={r.category}
                  onClick={() => setPicked({ kind: "kakao", r })}
                />
              );
            })}
          </>
        )}

        {/* Manual entry — ALWAYS visible so user can register anywhere */}
        <SectionLabel>
          {mineNearby.length === 0 && kakaoNearby.length === 0
            ? "가게 이름 직접 입력"
            : "직접 입력"}
        </SectionLabel>
        <div
          className="rounded-2xl p-3.5 flex items-center gap-3"
          style={{
            background: picked?.kind === "manual" ? "var(--accent-soft)" : "white",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            border:
              picked?.kind === "manual"
                ? "1.5px solid var(--accent)"
                : "1.5px solid transparent",
          }}
        >
          <span style={{ color: "var(--text-2)" }}>✏️</span>
          <input
            type="text"
            value={manualName}
            onChange={(e) => {
              setManualName(e.target.value);
              if (e.target.value) setPicked({ kind: "manual", name: e.target.value });
              else if (picked?.kind === "manual") setPicked(null);
            }}
            placeholder="가게 이름을 적어 주세요"
            className="flex-1 bg-transparent outline-none text-[15px]"
            style={{ color: "var(--text)" }}
          />
        </div>

        {/* Rating — always visible */}
        <div className="rounded-2xl p-4 bg-white mt-3" style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div className="text-[13px] font-semibold mb-2" style={{ color: "var(--text-2)" }}>
            평점 (선택)
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(rating === n ? null : n)}
                className="flex-1 h-11 rounded-xl text-[20px]"
                style={{
                  background:
                    rating !== null && n <= rating ? "var(--accent-soft)" : "var(--bg)",
                  color: rating !== null && n <= rating ? "var(--accent)" : "var(--text-3)",
                }}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* Memo — always visible */}
        <div className="rounded-2xl p-4 bg-white" style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div className="text-[13px] font-semibold mb-1" style={{ color: "var(--text-2)" }}>
            한 줄 메모 (선택)
          </div>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder={analysis?.description ?? "어땠어요?"}
            className="w-full bg-transparent outline-none text-[15px]"
            style={{ color: "var(--text)" }}
          />
        </div>
      </div>

      {/* Save bar — always visible, disabled if no pick */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 pt-3 pb-6"
        style={{
          background: "linear-gradient(to top, var(--bg) 0%, var(--bg) 70%, transparent 100%)",
        }}
      >
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !picked}
          className="w-full h-[54px] rounded-2xl text-white text-[17px] font-bold transition-opacity"
          style={{
            background: picked ? "var(--accent)" : "var(--text-3)",
            boxShadow: picked ? "0 8px 20px rgba(255,111,61,0.28)" : "none",
            opacity: !picked || saving ? 0.6 : 1,
          }}
        >
          {!picked
            ? "가게를 선택하거나 이름을 적어 주세요"
            : saving
              ? "저장 중…"
              : picked.kind === "mine"
                ? "다시 방문 기록"
                : "맛집 등록"}
        </button>
      </div>
    </div>
  );
}

function PhotoPicker({ onPick }: { onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-2"
      style={{
        background: "var(--bg)",
        color: "var(--text-2)",
      }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </div>
      <span className="text-[16px] font-semibold" style={{ color: "var(--text)" }}>
        사진 촬영 또는 선택
      </span>
      <span className="text-[12px]">사진 없이도 가능해요</span>
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[11px] font-semibold uppercase tracking-wider px-1 pt-1.5"
      style={{ color: "var(--text-2)" }}
    >
      {children}
    </div>
  );
}

interface CandidateProps {
  title: string;
  subtitle: string;
  badge?: string;
  selected?: boolean;
  image?: string | null;
  category?: string | null;
  onClick: () => void;
}

function Candidate({ title, subtitle, badge, selected, image, category, onClick }: CandidateProps) {
  const s = categoryStyle(category);
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl p-3 flex items-center gap-3 transition-colors text-left"
      style={{
        background: selected ? "var(--accent-soft)" : "white",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <div
        className="w-12 h-12 rounded-xl overflow-hidden relative shrink-0 flex items-center justify-center text-[22px]"
        style={{ background: image ? "var(--bg)" : s.gradient }}
      >
        {image ? (
          <Image src={image} alt="" fill sizes="48px" className="object-cover" />
        ) : (
          <span aria-hidden="true">{s.emoji}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[15px] font-bold truncate">{title}</span>
          {badge && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
              style={{ background: "var(--accent)", color: "white" }}
            >
              {badge}
            </span>
          )}
        </div>
        <div className="text-[12px] truncate" style={{ color: "var(--text-2)" }}>
          {subtitle}
        </div>
      </div>
      <span
        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
        style={{
          borderColor: selected ? "var(--accent)" : "var(--text-3)",
          background: selected ? "var(--accent)" : "transparent",
          color: "white",
          fontSize: 11,
        }}
      >
        {selected && "✓"}
      </span>
    </button>
  );
}

function todayLocalISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split("T")[0];
}

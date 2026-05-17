"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { RestaurantImage } from "@/lib/types";
import Lightbox from "./Lightbox";
import MenuExtractor from "./MenuExtractor";
import type { MenuData } from "@/app/(main)/restaurants/[id]/menu-action";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

interface AnalysisResult {
  category: string;
  confidence: "high" | "medium" | "low";
  description: string;
  detected_items: string[];
}

interface Props {
  restaurantId: string;
  images: RestaurantImage[];
  currentCategory: string | null;
  applyCategory: (restaurantId: string, category: string) => Promise<void>;
  saveMenu: (restaurantId: string, menu: MenuData) => Promise<void>;
}

export default function ImageUpload({
  restaurantId,
  images: initialImages,
  currentCategory,
  applyCategory,
  saveMenu,
}: Props) {
  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [suggestion, setSuggestion] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("restaurantId", restaurantId);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const { image, error } = await res.json();

    if (error || !image) {
      alert("업로드 실패: " + (error ?? "Unknown"));
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setImages((prev) => [...prev, image]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";

    // Run AI analysis on first upload if no category set
    if (!currentCategory && !suggestion && image.id !== dismissedFor) {
      analyzeImage(image.id);
    }
  }

  async function analyzeImage(imageId: string) {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/ai/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });
      if (!res.ok) return;
      const result: AnalysisResult = await res.json();
      if (result.confidence !== "low") {
        setSuggestion(result);
      }
    } catch {
      // silent
    } finally {
      setAnalyzing(false);
    }
  }

  function applySuggestion() {
    if (!suggestion) return;
    startTransition(async () => {
      try {
        await applyCategory(restaurantId, suggestion.category);
        setSuggestion(null);
      } catch {
        alert("적용 실패");
      }
    });
  }

  function dismissSuggestion() {
    setSuggestion(null);
    if (images.length > 0) setDismissedFor(images[images.length - 1].id);
  }

  async function handleDelete(img: RestaurantImage) {
    const res = await fetch(`/api/upload?id=${encodeURIComponent(img.id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      alert("삭제 실패");
      return;
    }
    setImages((prev) => {
      const remaining = prev.filter((i) => i.id !== img.id);
      if (img.is_primary && remaining.length > 0 && !remaining.some((i) => i.is_primary)) {
        remaining[0] = { ...remaining[0], is_primary: true };
      }
      return remaining;
    });
  }

  async function handleSetPrimary(imageId: string) {
    const supabase = createClient();
    await supabase
      .from("restaurant_images")
      .update({ is_primary: false })
      .eq("restaurant_id", restaurantId);
    await supabase
      .from("restaurant_images")
      .update({ is_primary: true })
      .eq("id", imageId);
    setImages((prev) => prev.map((i) => ({ ...i, is_primary: i.id === imageId })));
  }

  async function manualAnalyze() {
    const primary = images.find((i) => i.is_primary) ?? images[0];
    if (!primary) return;
    setSuggestion(null);
    setDismissedFor(null);
    await analyzeImage(primary.id);
  }

  return (
    <div className="p-1">
      <div className="flex items-center justify-between mb-3 px-2">
        <span className="text-[13px]" style={{ color: "var(--text-2)" }}>
          {images.length}장
        </span>
        <div className="flex gap-1.5">
          {images.length > 0 && (
            <MenuExtractor
              restaurantId={restaurantId}
              imageId={(images.find((i) => i.is_primary) ?? images[0]).id}
              saveMenu={saveMenu}
            />
          )}
          {!currentCategory && images.length > 0 && !suggestion && !analyzing && (
            <button
              type="button"
              onClick={manualAnalyze}
              className="rounded-full text-[12px] font-semibold px-3 py-1.5 flex items-center gap-1"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              ✨ AI 분석
            </button>
          )}
          <label
            className="cursor-pointer rounded-full text-[13px] font-semibold px-3 py-1.5"
            style={{ background: "var(--bg)", color: "var(--text)" }}
          >
            {uploading ? "업로드 중..." : "+ 추가"}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {(analyzing || suggestion) && (
        <div
          className="mx-2 mb-3 rounded-2xl p-3"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,111,61,0.10) 0%, rgba(217,74,30,0.05) 100%)",
            boxShadow: "inset 0 0 0 0.5px var(--separator)",
          }}
        >
          {analyzing && !suggestion ? (
            <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--text-2)" }}>
              <span style={{ color: "var(--accent)" }}>✨</span>
              <span>사진 분석 중...</span>
            </div>
          ) : suggestion ? (
            <>
              <div className="flex items-center gap-1.5 mb-1">
                <span style={{ color: "var(--accent)" }}>✨</span>
                <span
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--accent)" }}
                >
                  AI 분석 결과
                </span>
              </div>
              <p className="text-[14px] font-semibold mt-0.5">
                <span style={{ color: "var(--accent)" }}>{suggestion.category}</span>
                <span className="text-[13px] font-normal ml-1.5" style={{ color: "var(--text-2)" }}>
                  · {suggestion.description}
                </span>
              </p>
              {suggestion.detected_items.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {suggestion.detected_items.map((item, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.6)", color: "var(--text-2)" }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={applySuggestion}
                  disabled={pending}
                  className="flex-1 h-9 rounded-xl text-[13px] font-bold text-white disabled:opacity-50"
                  style={{ background: "var(--accent)" }}
                >
                  {pending ? "적용 중..." : `'${suggestion.category}'로 분류`}
                </button>
                <button
                  type="button"
                  onClick={dismissSuggestion}
                  className="px-4 h-9 rounded-xl text-[13px] font-semibold"
                  style={{ background: "rgba(255,255,255,0.6)", color: "var(--text-2)" }}
                >
                  무시
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}

      {images.length > 0 ? (
        <div className="grid grid-cols-3 gap-1.5">
          {images.map((img, i) => (
            <div
              key={img.id}
              className="relative group aspect-square rounded-xl overflow-hidden"
              style={{ background: "var(--bg)" }}
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(i)}
                className="absolute inset-0"
                aria-label="사진 크게 보기"
              >
                <Image
                  src={`${IMAGE_BASE}/${img.storage_path}`}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 33vw, 200px"
                  className="object-cover"
                />
              </button>
              {img.is_primary && (
                <span
                  className="absolute top-1.5 left-1.5 text-[11px] font-semibold text-white px-2 py-0.5 rounded-full pointer-events-none"
                  style={{ background: "var(--accent)" }}
                >
                  대표
                </span>
              )}
              <div className="absolute bottom-1.5 right-1.5 flex gap-1">
                {!img.is_primary && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetPrimary(img.id);
                    }}
                    className="text-[10px] bg-white/90 backdrop-blur text-gray-800 px-2 py-1 rounded-full font-semibold"
                  >
                    대표
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(img);
                  }}
                  aria-label="삭제"
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[14px] font-bold"
                  style={{ background: "rgba(255,59,48,0.92)" }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[14px] text-center py-6" style={{ color: "var(--text-2)" }}>
          사진이 없어요
        </p>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}

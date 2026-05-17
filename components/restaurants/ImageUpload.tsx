"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { RestaurantImage } from "@/lib/types";
import Lightbox from "./Lightbox";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

interface Props {
  restaurantId: string;
  images: RestaurantImage[];
}

export default function ImageUpload({ restaurantId, images: initialImages }: Props) {
  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
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
      // If we deleted primary, server promotes another; reflect locally by setting first as primary
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

  return (
    <div className="p-1">
      <div className="flex items-center justify-between mb-3 px-2">
        <span className="text-[13px]" style={{ color: "var(--text-2)" }}>
          {images.length}장
        </span>
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

"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { RestaurantImage } from "@/lib/types";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

interface Props {
  restaurantId: string;
  images: RestaurantImage[];
}

export default function ImageUpload({ restaurantId, images: initialImages }: Props) {
  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);
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

    if (error) {
      alert("업로드 실패: " + error);
      setUploading(false);
      return;
    }

    // 첫 이미지면 대표 이미지로 설정
    if (images.length === 0) {
      const supabase = createClient();
      await supabase
        .from("restaurant_images")
        .update({ is_primary: true })
        .eq("id", image.id);
      image.is_primary = true;
    }

    setImages((prev) => [...prev, image]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleDelete(img: RestaurantImage) {
    const supabase = createClient();
    await fetch(`/api/upload?path=${encodeURIComponent(img.storage_path)}`, { method: "DELETE" });
    await supabase.from("restaurant_images").delete().eq("id", img.id);
    setImages((prev) => prev.filter((i) => i.id !== img.id));
  }

  async function handleSetPrimary(imageId: string) {
    const supabase = createClient();
    await supabase.from("restaurant_images")
      .update({ is_primary: false })
      .eq("restaurant_id", restaurantId);
    await supabase.from("restaurant_images")
      .update({ is_primary: true })
      .eq("id", imageId);
    setImages((prev) => prev.map((i) => ({ ...i, is_primary: i.id === imageId })));
  }

  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">사진</h3>
        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-sm px-3 py-1.5 rounded-lg transition-colors">
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
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={`${IMAGE_BASE}/${img.storage_path}`}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
              {img.is_primary && (
                <span className="absolute top-1 left-1 text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded">
                  대표
                </span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {!img.is_primary && (
                  <button
                    onClick={() => handleSetPrimary(img.id)}
                    className="text-xs bg-white text-gray-800 px-2 py-1 rounded"
                  >
                    대표 설정
                  </button>
                )}
                <button
                  onClick={() => handleDelete(img)}
                  className="text-xs bg-red-500 text-white px-2 py-1 rounded"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-4">사진이 없어요</p>
      )}
    </div>
  );
}

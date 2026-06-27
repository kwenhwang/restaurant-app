"use client";

import Image from "next/image";
import CategoryPlaceholder from "@/components/restaurants/CategoryPlaceholder";
import { categoryStyle } from "@/lib/category-icons";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

interface Props {
  name: string;
  category: string | null;
  storage_path: string | null;
  blur_data_url?: string | null;
  onClick: () => void;
  disabled?: boolean;
}

export default function OpponentCard({ name, category, storage_path, blur_data_url, onClick, disabled }: Props) {
  const s = categoryStyle(category);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="relative w-full overflow-hidden rounded-2xl transition-transform active:scale-95 disabled:opacity-50"
      style={{ aspectRatio: "3/4", boxShadow: "var(--shadow-1)" }}
    >
      {storage_path ? (
        <Image
          src={`${IMAGE_BASE}/${storage_path}`}
          alt={name}
          fill
          sizes="(max-width: 768px) 50vw, 300px"
          className="object-cover"
          {...(blur_data_url
            ? { placeholder: "blur" as const, blurDataURL: blur_data_url }
            : {})}
        />
      ) : (
        <CategoryPlaceholder category={category} size="hero" />
      )}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, transparent 35%, rgba(0,0,0,0.65) 100%)" }}
      />
      <div className="absolute left-3 right-3 bottom-3 text-white text-left">
        <span
          className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mb-1.5"
          style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(6px)" }}
        >
          {s.emoji} {category ?? "기타"}
        </span>
        <div className="font-display text-[18px] font-extrabold leading-tight line-clamp-2">
          {name}
        </div>
      </div>
    </button>
  );
}

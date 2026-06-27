"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";

interface Props {
  images: { id: string; storage_path: string; blur_data_url?: string | null }[];
  startIndex: number;
  onClose: () => void;
}

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

export default function Lightbox({ images, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);
  const startX = useRef<number | null>(null);
  const deltaX = useRef(0);
  const [drag, setDrag] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(images.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [images.length, onClose]);

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    deltaX.current = 0;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (startX.current === null) return;
    deltaX.current = e.touches[0].clientX - startX.current;
    setDrag(deltaX.current);
  }
  function onTouchEnd() {
    if (Math.abs(deltaX.current) > 60) {
      if (deltaX.current < 0 && index < images.length - 1) setIndex(index + 1);
      else if (deltaX.current > 0 && index > 0) setIndex(index - 1);
    }
    startX.current = null;
    deltaX.current = 0;
    setDrag(0);
  }

  const current = images[index];
  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "rgba(0,0,0,0.95)" }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex justify-between items-center px-5 py-4 text-white">
        <span className="text-[14px] font-semibold">
          {index + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="w-9 h-9 rounded-full flex items-center justify-center text-[20px]"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          ×
        </button>
      </div>

      <div className="flex-1 relative" style={{ touchAction: "pan-y" }}>
        <div
          className="absolute inset-0 transition-transform"
          style={{
            transform: drag ? `translateX(${drag}px)` : undefined,
            transitionDuration: drag ? "0ms" : "200ms",
          }}
        >
          <Image
            src={`${IMAGE_BASE}/${current.storage_path}`}
            alt=""
            fill
            sizes="100vw"
            className="object-contain"
            priority
            {...(current.blur_data_url
              ? { placeholder: "blur" as const, blurDataURL: current.blur_data_url }
              : {})}
          />
        </div>
      </div>

      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 py-4">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className="w-1.5 h-1.5 rounded-full transition-opacity"
              style={{
                background: "white",
                opacity: i === index ? 1 : 0.35,
              }}
              aria-label={`${i + 1}번째 사진`}
            />
          ))}
        </div>
      )}

      {/* Side tap zones for desktop */}
      {index > 0 && (
        <button
          type="button"
          onClick={() => setIndex(index - 1)}
          aria-label="이전"
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white text-[24px] hidden md:flex"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          ‹
        </button>
      )}
      {index < images.length - 1 && (
        <button
          type="button"
          onClick={() => setIndex(index + 1)}
          aria-label="다음"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white text-[24px] hidden md:flex"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          ›
        </button>
      )}
    </div>
  );
}

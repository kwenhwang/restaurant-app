"use client";

// Client form for creating / editing restaurants.
//
// We intercept submission via React's onSubmit + build FormData from the
// form element directly. The natural-looking `<form action={serverAction}>`
// pattern triggers React's progressive-enhancement field-name prefixing
// (`_1_name` etc.), which breaks `formData.get("name")` reads on the server
// — same root cause as the CollectionForm fix in commit 2825629.

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Category, Restaurant } from "@/lib/types";
import LocationPicker from "./LocationPicker";

const CATEGORIES: Category[] = ["한식", "중식", "일식", "양식", "카페", "술집", "기타"];

type ActionResult = { id: string } | { error: string };

interface Props {
  action: (formData: FormData) => Promise<ActionResult>;
  restaurant?: Restaurant;
}

export default function RestaurantForm({ action, restaurant }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(restaurant?.name ?? "");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current) return;
    if (!name.trim()) {
      setError("이름은 필수예요");
      return;
    }
    setError(null);
    const fd = new FormData(formRef.current);
    startTransition(async () => {
      const result = await action(fd);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.push(`/restaurants/${result.id}`);
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 px-5">
      <div className="rounded-2xl px-4 py-2.5" style={{ background: "var(--bg)" }}>
        <div className="text-[11px] font-semibold tracking-wide" style={{ color: "var(--text-2)" }}>
          이름 <span style={{ color: "var(--accent)" }}>*</span>
        </div>
        <input
          name="name_visible"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="맛집 이름"
          className="w-full bg-transparent outline-none text-[16px] mt-0.5"
          style={{ color: "var(--text)" }}
        />
      </div>

      <LocationPicker
        name={name}
        initialAddress={restaurant?.address ?? ""}
        initialLat={restaurant?.lat ?? null}
        initialLng={restaurant?.lng ?? null}
        onChange={(v) => {
          if (v.name && !name) setName(v.name);
        }}
      />

      {/* The LocationPicker emits hidden name/address/lat/lng inputs. We
          also keep a separate hidden name in case the user typed manually
          before/without picking a location — the React state is the
          source of truth. Both copies hold the same value (state-bound),
          so duplicate keys in FormData are harmless. */}
      <input type="hidden" name="name" value={name} />

      <div className="rounded-2xl px-4 py-2.5" style={{ background: "var(--bg)" }}>
        <div className="text-[11px] font-semibold tracking-wide" style={{ color: "var(--text-2)" }}>카테고리</div>
        <select
          name="category"
          defaultValue={restaurant?.category ?? ""}
          className="w-full bg-transparent outline-none text-[15px] mt-0.5"
          style={{ color: "var(--text)" }}
        >
          <option value="">선택</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl px-4 py-2.5" style={{ background: "var(--bg)" }}>
        <div className="text-[11px] font-semibold tracking-wide" style={{ color: "var(--text-2)" }}>메모</div>
        <textarea
          name="note"
          defaultValue={restaurant?.note ?? ""}
          rows={3}
          placeholder="메모 (선택)"
          className="w-full bg-transparent outline-none text-[15px] mt-0.5 resize-none"
          style={{ color: "var(--text)" }}
        />
      </div>

      {error && (
        <p className="text-[13px] px-1" style={{ color: "var(--error)" }}>
          ⚠️ {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !name.trim()}
        className="w-full h-[52px] rounded-2xl text-white text-[17px] font-bold disabled:opacity-50 transition-transform active:scale-[0.98]"
        style={{ background: "var(--accent)", boxShadow: "0 8px 20px rgba(255,111,61,0.28)" }}
      >
        {pending ? "저장 중…" : restaurant ? "수정 저장" : "추가"}
      </button>
    </form>
  );
}

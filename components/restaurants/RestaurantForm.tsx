"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Category, Restaurant } from "@/lib/types";
import LocationPicker from "./LocationPicker";

const CATEGORIES: Category[] = ["한식", "중식", "일식", "양식", "카페", "술집", "기타"];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full h-[52px] rounded-2xl text-white text-[17px] font-bold disabled:opacity-50 transition-transform active:scale-[0.98]"
      style={{ background: "var(--accent)", boxShadow: "0 8px 20px rgba(255,111,61,0.28)" }}
    >
      {pending ? "저장 중..." : label}
    </button>
  );
}

interface Props {
  action: (formData: FormData) => Promise<void>;
  restaurant?: Restaurant;
}

export default function RestaurantForm({ action, restaurant }: Props) {
  const [name, setName] = useState(restaurant?.name ?? "");

  return (
    <form action={action} className="space-y-5 px-5">
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

      {/* name이 LocationPicker에서도 hidden으로 들어가지만, 사용자가 직접 수정한 경우 우선 */}
      <input type="hidden" name="name" value={name} />

      <div className="grid grid-cols-2 gap-3">
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
          <div className="text-[11px] font-semibold tracking-wide" style={{ color: "var(--text-2)" }}>평점</div>
          <select
            name="rating"
            defaultValue={restaurant?.rating?.toString() ?? ""}
            className="w-full bg-transparent outline-none text-[15px] mt-0.5"
            style={{ color: "var(--text)" }}
          >
            <option value="">선택</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{"★".repeat(n)} {n}점</option>
            ))}
          </select>
        </div>
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

      <SubmitButton label={restaurant ? "수정 저장" : "추가"} />
    </form>
  );
}

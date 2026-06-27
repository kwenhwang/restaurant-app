"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { haptic } from "@/lib/haptic";

function todayLocalISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split("T")[0];
}

interface Props {
  restaurantId: string;
}

export default function AddVisit({ restaurantId }: Props) {
  const router = useRouter();
  const [date, setDate] = useState(todayLocalISO);
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("visits")
      .insert({
        user_id: user.id,
        restaurant_id: restaurantId,
        visited_at: date,
        memo: memo || null,
      });

    setLoading(false);

    if (error) {
      haptic("error");
      alert("기록 실패: " + error.message);
      return;
    }

    haptic("success");
    setMemo("");
    setDate(todayLocalISO());
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-[14px] font-semibold rounded-2xl py-2.5"
        style={{ background: "var(--bg)", color: "var(--accent)" }}
      >
        + 방문 기록 추가
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl p-4 space-y-3" style={{ background: "var(--bg)" }}>
      <div className="rounded-2xl px-4 py-2.5" style={{ background: "white" }}>
        <div className="text-[11px] font-semibold tracking-wide" style={{ color: "var(--text-2)" }}>
          방문 날짜
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full bg-transparent outline-none text-[15px] mt-0.5"
          style={{ color: "var(--text)" }}
        />
      </div>

      <div className="rounded-2xl px-4 py-2.5" style={{ background: "white" }}>
        <div className="text-[11px] font-semibold tracking-wide" style={{ color: "var(--text-2)" }}>
          메모 (선택)
        </div>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="간단한 메모"
          className="w-full bg-transparent outline-none text-[15px] mt-0.5"
          style={{ color: "var(--text)" }}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 h-[44px] rounded-2xl text-white text-[14px] font-bold disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          {loading ? "저장 중..." : "기록 저장"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-5 h-[44px] rounded-2xl text-[14px] font-semibold"
          style={{ background: "white", color: "var(--text)" }}
        >
          취소
        </button>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Visit } from "@/lib/types";

interface Props {
  restaurantId: string;
  onAdded?: (visit: Visit) => void;
}

export default function AddVisit({ restaurantId, onAdded }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("visits")
      .insert({ user_id: user.id, restaurant_id: restaurantId, visited_at: date, memo: memo || null })
      .select()
      .single();

    if (data && onAdded) onAdded(data);
    setMemo("");
    setOpen(false);
    setLoading(false);
    // 페이지 새로고침으로 목록 갱신
    window.location.reload();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-sm text-orange-500 border border-orange-200 rounded-lg py-2 hover:bg-orange-50 transition-colors mb-4"
      >
        + 방문 기록 추가
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-orange-50 rounded-lg p-4 mb-4 space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">방문 날짜</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">메모 (선택)</label>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="간단한 메모"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-orange-500 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? "저장 중..." : "기록 저장"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 text-sm text-gray-500 border rounded-lg"
        >
          취소
        </button>
      </div>
    </form>
  );
}

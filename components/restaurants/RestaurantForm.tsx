"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Category, Restaurant } from "@/lib/types";

const CATEGORIES: Category[] = ["한식", "중식", "일식", "양식", "카페", "술집", "기타"];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg py-2.5 disabled:opacity-50 transition-colors"
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
  const [address, setAddress] = useState(restaurant?.address ?? "");
  const [lat, setLat] = useState(restaurant?.lat?.toString() ?? "");
  const [lng, setLng] = useState(restaurant?.lng?.toString() ?? "");

  async function searchAddress() {
    if (!address) return;
    try {
      const res = await fetch(`/api/kakao/address?query=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (data.lat && data.lng) {
        setLat(data.lat);
        setLng(data.lng);
      }
    } catch {
      // 주소 검색 실패 시 무시
    }
  }

  return (
    <form action={action} className="space-y-4 bg-white rounded-xl border p-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          이름 <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          defaultValue={restaurant?.name}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          placeholder="맛집 이름"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
        <div className="flex gap-2">
          <input
            name="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="주소 입력"
          />
          <button
            type="button"
            onClick={searchAddress}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-sm rounded-lg transition-colors whitespace-nowrap"
          >
            좌표 검색
          </button>
        </div>
        <input type="hidden" name="lat" value={lat} />
        <input type="hidden" name="lng" value={lng} />
        {lat && lng && (
          <p className="text-xs text-gray-400 mt-1">📍 {lat}, {lng}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
          <select
            name="category"
            defaultValue={restaurant?.category ?? ""}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          >
            <option value="">선택 안 함</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">평점</label>
          <select
            name="rating"
            defaultValue={restaurant?.rating?.toString() ?? ""}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          >
            <option value="">선택 안 함</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{"★".repeat(n)} {n}점</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
        <textarea
          name="note"
          defaultValue={restaurant?.note ?? ""}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          placeholder="메모 (선택사항)"
        />
      </div>

      <SubmitButton label={restaurant ? "수정 저장" : "추가"} />
    </form>
  );
}

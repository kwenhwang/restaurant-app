import Link from "next/link";
import { LargeTitle } from "@/components/ui/LargeTitle";
import { createCollection } from "../actions";

export default function NewCollectionPage() {
  return (
    <div className="pb-24">
      <LargeTitle eyebrow="새 컬렉션" title="리스트 만들기" />

      <form action={createCollection} className="px-[18px] space-y-4 mt-2">
        <div
          className="p-4 rounded-2xl space-y-3"
          style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
        >
          <label className="block">
            <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "var(--text-2)" }}>
              이름
            </span>
            <input
              type="text"
              name="name"
              required
              maxLength={60}
              placeholder="예: 강남 데이트 코스"
              className="mt-1 w-full bg-transparent border-0 outline-none text-[18px] font-display font-bold"
            />
          </label>
          <label className="block">
            <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "var(--text-2)" }}>
              설명 (선택)
            </span>
            <textarea
              name="description"
              maxLength={280}
              rows={3}
              placeholder="이 리스트를 한 줄로 소개해주세요"
              className="mt-1 w-full bg-transparent border-0 outline-none text-[15px] resize-none"
            />
          </label>
          <label className="flex items-center gap-2 mt-2">
            <input type="checkbox" name="is_public" className="w-4 h-4" />
            <span className="text-[14px]">공개 리스트로 만들기 (링크로 공유 가능)</span>
          </label>
        </div>

        <div className="flex gap-2">
          <Link
            href="/collections"
            className="flex-1 h-12 rounded-full text-[15px] font-bold flex items-center justify-center"
            style={{ background: "var(--surface)", color: "var(--text)" }}
          >
            취소
          </Link>
          <button
            type="submit"
            className="flex-1 h-12 rounded-full text-[15px] font-bold text-white"
            style={{ background: "var(--accent)" }}
          >
            만들기
          </button>
        </div>
      </form>
    </div>
  );
}

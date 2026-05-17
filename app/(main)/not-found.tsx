import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-[28px]"
        style={{ background: "var(--bg)", color: "var(--text-2)" }}
      >
        🍽️
      </div>
      <h2 className="text-[20px] font-bold mb-1">없는 페이지에요</h2>
      <p className="text-[14px] mb-5" style={{ color: "var(--text-2)" }}>
        주소가 잘못됐거나, 삭제된 항목이에요
      </p>
      <Link
        href="/"
        className="h-[44px] px-6 rounded-2xl text-white font-semibold flex items-center"
        style={{ background: "var(--accent)" }}
      >
        홈으로
      </Link>
    </div>
  );
}

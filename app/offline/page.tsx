"use client";

export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: "var(--bg)" }}>
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-[28px]"
        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
      >
        📡
      </div>
      <h1 className="text-[20px] font-bold">오프라인 상태에요</h1>
      <p className="text-[14px] mt-2 max-w-[280px]" style={{ color: "var(--text-2)" }}>
        인터넷에 연결되면 자동으로 다시 표시됩니다. 이미 본 페이지는 그대로 사용할 수 있어요.
      </p>
      <button
        onClick={() => location.reload()}
        className="mt-6 h-[44px] px-6 rounded-2xl text-white font-bold"
        style={{ background: "var(--accent)" }}
      >
        새로고침
      </button>
    </div>
  );
}

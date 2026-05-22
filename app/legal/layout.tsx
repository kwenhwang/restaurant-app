import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header className="flex items-center px-4 pt-3.5 pb-2.5">
        <Link
          href="/"
          className="text-[15px]"
          style={{ color: "var(--text-2)" }}
        >
          ← 돌아가기
        </Link>
      </header>
      <main className="mx-auto max-w-[640px] px-5 pb-12">{children}</main>
    </div>
  );
}

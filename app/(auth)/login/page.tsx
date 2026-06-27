"use client";

// app/(auth)/login/page.tsx — v3 (F1)
// Google OAuth logic unchanged. Re-skinned: warm gradient backdrop, floating
// food plates, brand mark, welcome copy, value props.

import { useState } from "react";
import Link from "next/link";
import Sym from "@/components/ui/Sym";

const PLATES = [
  { e: "🍜", g: "linear-gradient(150deg,#FFE5EC 0%,#F49EB1 55%,#D45C86 100%)", s: 92, x: -120, y: 8, rot: -12 },
  { e: "🍰", g: "linear-gradient(150deg,#FFE0EC 0%,#EC9BC6 55%,#C65C97 100%)", s: 78, x: 116, y: -4, rot: 10 },
  { e: "☕️", g: "linear-gradient(150deg,#F2E5D5 0%,#C9A07A 55%,#8A6A4A 100%)", s: 70, x: 96, y: 96, rot: -6 },
  { e: "🍲", g: "linear-gradient(150deg,#FFE3D0 0%,#F58A5A 60%,#E8552E 100%)", s: 84, x: -108, y: 104, rot: 8 },
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signInWithGoogle() {
    setError("");
    setLoading(true);
    // Lazy-load Supabase client — saves ~50 KB on the OAuth-only login page.
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex flex-col px-6 pb-9"
      style={{ background: "radial-gradient(120% 70% at 50% -10%, var(--accent-soft) 0%, var(--bg) 55%)" }}
    >
      {/* floating plates + brand mark */}
      <div className="relative" style={{ height: 280, marginTop: 16 }}>
        {PLATES.map((p, i) => (
          <div
            key={i}
            aria-hidden
            className="absolute flex items-center justify-center animate-fade-up"
            style={{
              top: 120 + p.y, left: "50%", width: p.s, height: p.s, borderRadius: p.s / 4,
              transform: `translateX(calc(-50% + ${p.x}px)) rotate(${p.rot}deg)`,
              background: p.g, fontSize: p.s * 0.46,
              boxShadow: "0 12px 26px rgba(40,30,15,0.12)", animationDelay: `${i * 0.07}s`,
            }}
          >
            {p.e}
          </div>
        ))}
        <div
          className="absolute flex items-center justify-center text-white"
          style={{
            top: 96, left: "50%", transform: "translateX(-50%)", width: 88, height: 88, borderRadius: 26, zIndex: 5,
            background: "linear-gradient(150deg, var(--accent), var(--accent-press))",
            boxShadow: "0 16px 32px color-mix(in srgb, var(--accent) 42%, transparent), inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
        >
          <Sym name="fork.knife" size={42} strokeWidth={2} />
        </div>
      </div>

      <div className="text-center px-6">
        <h1 className="font-display text-[34px] font-black" style={{ letterSpacing: "-0.8px" }}>맛집 기록장</h1>
        <p className="mt-3 text-[16px] leading-relaxed" style={{ color: "var(--text-2)" }}>
          사진 한 장으로 시작하는
          <br />
          <b style={{ color: "var(--text)" }}>나만의 사적인 미식 일지.</b>
        </p>
      </div>

      <div className="flex-1" />

      <div className="flex gap-5 justify-center mb-6 text-[12.5px]" style={{ color: "var(--text-2)" }}>
        {[["📸", "찍으면 끝"], ["✨", "AI 자동정리"], ["🗺️", "나만의 지도"]].map(([e, l]) => (
          <div key={l} className="flex flex-col items-center gap-1.5">
            <span style={{ fontSize: 22 }}>{e}</span>
            <span className="font-semibold">{l}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={loading}
        className="h-[54px] rounded-2xl text-[16px] font-bold flex items-center justify-center gap-2.5 disabled:opacity-50 transition-transform active:scale-[0.98]"
        style={{ background: "var(--surface)", color: "var(--text)", boxShadow: "var(--shadow-2), inset 0 0 0 1px var(--separator)" }}
      >
        <GoogleLogo />
        {loading ? "이동 중..." : "Google로 계속하기"}
      </button>

      {error && (
        <p className="text-[13px] px-1 text-center mt-3" style={{ color: "#E5484D" }}>{error}</p>
      )}

      <p className="text-center text-[12px] mt-4 leading-relaxed" style={{ color: "var(--text-3)" }}>
        계속을 누르면 다음에 동의한 것으로 간주됩니다.
        <br />
        <Link href="/legal/terms" className="font-semibold underline" style={{ color: "var(--text-2)" }}>이용약관</Link>
        {"  ·  "}
        <Link href="/legal/privacy" className="font-semibold underline" style={{ color: "var(--text-2)" }}>개인정보처리방침</Link>
      </p>
    </main>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

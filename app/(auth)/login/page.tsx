"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Sym from "@/components/ui/Sym";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signInWithGoogle() {
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // On success, browser is redirected to Google → callback → home.
  }

  return (
    <main className="min-h-screen flex flex-col bg-white px-6 pt-16 pb-9">
      <div className="flex flex-col items-center gap-4 mt-6">
        <div
          className="w-[76px] h-[76px] rounded-[22px] flex items-center justify-center text-white"
          style={{
            background: "linear-gradient(150deg, #FF6F3D, #D94A1E)",
            boxShadow:
              "0 14px 28px rgba(255,111,61,0.35), inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
        >
          <Sym name="fork.knife" size={36} strokeWidth={2} />
        </div>
        <div className="text-center">
          <h1 className="text-[28px] font-extrabold tracking-tight">맛집 기록장</h1>
          <p className="text-[15px] mt-1" style={{ color: "var(--text-2)" }}>
            나만의 미식 지도를 만들어 보세요
          </p>
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-3">
        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={loading}
          className="h-[54px] rounded-2xl bg-white text-[16px] font-semibold flex items-center justify-center gap-2.5 disabled:opacity-50 transition-transform active:scale-[0.98]"
          style={{
            boxShadow: "0 1px 2px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(0,0,0,0.08)",
            color: "var(--text)",
          }}
        >
          <GoogleLogo />
          {loading ? "이동 중..." : "Google로 계속하기"}
        </button>

        {error && (
          <p className="text-[13px] px-1 text-center" style={{ color: "#E5484D" }}>
            {error}
          </p>
        )}
      </div>

      <div className="flex-1" />

      <p
        className="text-center text-[12px] mt-6 leading-relaxed"
        style={{ color: "var(--text-2)" }}
      >
        계속을 누르면 다음에 동의한 것으로 간주됩니다.
        <br />
        <Link
          href="/legal/terms"
          className="font-semibold underline"
          style={{ color: "var(--text-2)" }}
        >
          이용약관
        </Link>
        {"  ·  "}
        <Link
          href="/legal/privacy"
          className="font-semibold underline"
          style={{ color: "var(--text-2)" }}
        >
          개인정보처리방침
        </Link>
      </p>
    </main>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

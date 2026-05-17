"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Sym from "@/components/ui/Sym";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
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

      <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-3">
        <FloatingField
          label="이메일"
          type="email"
          value={email}
          onChange={(v) => setEmail(v)}
          placeholder="you@example.com"
          required
        />
        <FloatingField
          label="비밀번호"
          type="password"
          value={password}
          onChange={(v) => setPassword(v)}
          placeholder="••••••••"
          required
        />

        {error && (
          <p className="text-[13px] px-1" style={{ color: "#E5484D" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="h-[52px] rounded-2xl text-white text-[17px] font-bold mt-1 disabled:opacity-50 transition-transform active:scale-[0.98]"
          style={{
            background: "var(--accent)",
            boxShadow: "0 8px 20px rgba(255,111,61,0.28)",
            letterSpacing: "-0.2px",
          }}
        >
          {loading ? "로그인 중..." : "계속"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px" style={{ background: "var(--separator)" }} />
        <span className="text-[12px]" style={{ color: "var(--text-2)" }}>또는</span>
        <div className="flex-1 h-px" style={{ background: "var(--separator)" }} />
      </div>

      <button
        type="button"
        className="h-[52px] rounded-2xl bg-black text-white text-[16px] font-semibold flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
      >
         Apple로 계속하기
      </button>

      <div className="flex-1" />
      <p className="text-center text-[14px]" style={{ color: "var(--text-2)" }}>
        계정이 없으신가요?{" "}
        <Link href="/signup" className="font-semibold" style={{ color: "var(--accent)" }}>
          가입하기
        </Link>
      </p>
    </main>
  );
}

function FloatingField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label
      className="block rounded-2xl px-4 py-2.5"
      style={{ background: "var(--bg)" }}
    >
      <div className="text-[11px] font-semibold tracking-wide" style={{ color: "var(--text-2)" }}>
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="w-full bg-transparent outline-none text-[16px] mt-0.5 placeholder:opacity-50"
        style={{ color: "var(--text)" }}
      />
    </label>
  );
}

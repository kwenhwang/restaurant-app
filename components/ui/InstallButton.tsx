"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS-only standalone flag
      window.navigator.standalone === true;
    if (standalone) {
      setInstalled(true);
      return;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua) && !/crios|fxios/.test(ua)) {
      setIsIOS(true);
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  async function install() {
    if (isIOS) {
      setShowIOSHelp(true);
      return;
    }
    if (!deferred) {
      alert("설치 아이콘을 찾을 수 없어요. 브라우저 메뉴(⋮) → '앱 설치'를 눌러 주세요.");
      return;
    }
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferred(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={install}
        className="w-full h-[44px] rounded-2xl text-[14px] font-semibold flex items-center justify-center gap-2"
        style={{ background: "var(--bg)", color: "var(--text)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
        </svg>
        앱으로 설치하기
      </button>

      {showIOSHelp && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowIOSHelp(false)}
        >
          <div
            className="w-full bg-white rounded-t-3xl p-6 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[17px] font-bold">홈 화면에 추가</h3>
            <ol className="text-[14px] space-y-1.5" style={{ color: "var(--text-2)" }}>
              <li>1. Safari 하단 공유 버튼 (네모+화살표) 탭</li>
              <li>2. 메뉴에서 "홈 화면에 추가" 선택</li>
              <li>3. "추가" 탭</li>
            </ol>
            <button
              onClick={() => setShowIOSHelp(false)}
              className="w-full h-[44px] rounded-2xl text-white font-semibold mt-2"
              style={{ background: "var(--accent)" }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __deferredInstall: BeforeInstallPromptEvent | null;
  }
}

export default function InstallButton() {
  const [available, setAvailable] = useState(false);
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

    if (window.__deferredInstall) setAvailable(true);

    const onInstallable = () => setAvailable(true);
    const onInstalled = () => {
      setInstalled(true);
      setAvailable(false);
    };
    window.addEventListener("pwa-installable", onInstallable);
    window.addEventListener("pwa-installed", onInstalled);
    return () => {
      window.removeEventListener("pwa-installable", onInstallable);
      window.removeEventListener("pwa-installed", onInstalled);
    };
  }, []);

  if (installed) return null;

  async function install() {
    if (isIOS) {
      setShowIOSHelp(true);
      return;
    }
    const prompt = window.__deferredInstall;
    if (!prompt) {
      alert(
        "설치 버튼이 아직 활성화되지 않았어요.\n\n앱을 한 번 새로고침하거나, Chrome 메뉴(⋮) → '앱 설치'를 직접 눌러 주세요."
      );
      return;
    }
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
    }
    window.__deferredInstall = null;
    setAvailable(false);
  }

  const showButton = isIOS || available;
  if (!showButton) {
    return (
      <div
        className="w-full rounded-2xl px-4 py-3 text-[13px]"
        style={{ background: "var(--bg)", color: "var(--text-2)" }}
      >
        Chrome 메뉴(⋮) → &quot;앱 설치&quot;로 설치할 수 있어요
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={install}
        className="w-full h-[44px] rounded-2xl text-white text-[14px] font-semibold flex items-center justify-center gap-2"
        style={{ background: "var(--accent)" }}
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
              <li>2. 메뉴에서 &quot;홈 화면에 추가&quot; 선택</li>
              <li>3. &quot;추가&quot; 탭</li>
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

"use client";

import { useEffect, useRef, useState } from "react";

interface ParsedMemo {
  name: string | null;
  category: string | null;
  memo: string | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: ArrayLike<{
    0: { transcript: string };
    isFinal: boolean;
    length: number;
  }>;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

interface WindowWithSpeech extends Window {
  SpeechRecognition?: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
}

interface Props {
  onParsed: (result: ParsedMemo) => void;
}

export default function VoiceInput({ onParsed }: Props) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    const w = window as WindowWithSpeech;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    setSupported(!!SR);
    return () => {
      recRef.current?.abort();
    };
  }, []);

  function start() {
    const w = window as WindowWithSpeech;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "ko-KR";

    rec.onresult = (e) => {
      let finalText = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      if (finalText) setTranscript((prev) => (prev + " " + finalText).trim());
      setInterim(interimText);
    };
    rec.onerror = (e) => {
      setError(
        e.error === "not-allowed"
          ? "마이크 권한이 필요해요"
          : e.error === "no-speech"
            ? "음성이 들리지 않아요"
            : "음성 인식 오류"
      );
      setListening(false);
    };
    rec.onend = () => setListening(false);

    setTranscript("");
    setInterim("");
    setError(null);
    rec.start();
    recRef.current = rec;
    setListening(true);
  }

  function stop() {
    recRef.current?.stop();
    setListening(false);
  }

  async function parse() {
    const full = (transcript + " " + interim).trim();
    if (!full) return;
    setParsing(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/parse-memo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: full }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onParsed(data);
      setTranscript("");
      setInterim("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석 실패");
    } finally {
      setParsing(false);
    }
  }

  if (!supported) {
    return (
      <div
        className="rounded-2xl p-3 text-[13px]"
        style={{ background: "var(--bg)", color: "var(--text-2)" }}
      >
        이 브라우저는 음성 입력을 지원하지 않아요. Chrome·Safari 추천.
      </div>
    );
  }

  const fullText = (transcript + " " + interim).trim();

  return (
    <div
      className="rounded-2xl p-3.5"
      style={{
        background: listening
          ? "linear-gradient(135deg, rgba(255,111,61,0.12), rgba(217,74,30,0.06))"
          : "var(--bg)",
        boxShadow: listening ? "inset 0 0 0 1.5px var(--accent)" : "none",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          onClick={listening ? stop : start}
          disabled={parsing}
          aria-label={listening ? "녹음 중단" : "녹음 시작"}
          className="w-11 h-11 rounded-full flex items-center justify-center text-white relative transition-transform active:scale-95 disabled:opacity-50"
          style={{ background: listening ? "var(--error)" : "var(--accent)" }}
        >
          {listening && (
            <span
              className="absolute inset-0 rounded-full"
              style={{
                background: "var(--error)",
                opacity: 0.4,
                animation: "voice-pulse 1.4s ease-out infinite",
              }}
            />
          )}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ position: "relative" }}>
            <rect x="9" y="2" width="6" height="13" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold">
            {listening ? "듣고 있어요…" : "음성으로 빠르게"}
          </div>
          <div className="text-[12px]" style={{ color: "var(--text-2)" }}>
            {listening
              ? "가게·메뉴·평점을 자유롭게 말해 보세요"
              : '예: "강남 본가에서 갈비탕 먹었음, 별 4개"'}
          </div>
        </div>
        {fullText && !listening && (
          <button
            type="button"
            onClick={parse}
            disabled={parsing}
            className="px-3 h-9 rounded-xl text-[13px] font-bold text-white disabled:opacity-50"
            style={{ background: "var(--accent)" }}
          >
            {parsing ? "분석…" : "적용"}
          </button>
        )}
      </div>

      {fullText && (
        <div
          className="rounded-xl p-2.5 text-[14px]"
          style={{ background: "var(--surface)", color: "var(--text)" }}
        >
          <span>{transcript}</span>
          {interim && (
            <span style={{ color: "var(--text-2)" }}> {interim}</span>
          )}
        </div>
      )}

      {error && (
        <p className="text-[12px] mt-2" style={{ color: "var(--error)" }}>
          {error}
        </p>
      )}

      <style>{`
        @keyframes voice-pulse {
          0% { transform: scale(1); opacity: 0.4; }
          70% { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

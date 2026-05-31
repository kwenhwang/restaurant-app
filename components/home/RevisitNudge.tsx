"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Sym from "@/components/ui/Sym";
import { categoryStyle } from "@/lib/category-icons";
import type { RevisitCandidate } from "@/lib/revisit";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;
const SNOOZE_DAYS = 7;
const STORAGE_KEY = "revisit:dismissed";

interface Props {
  candidates: RevisitCandidate[];
}

type DismissMap = Record<string, number>;

function loadDismissed(): DismissMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as DismissMap;
  } catch {
    return {};
  }
}

function saveDismissed(map: DismissMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

function isStillSnoozed(ts: number | undefined): boolean {
  if (!ts) return false;
  const cutoff = Date.now() - SNOOZE_DAYS * 24 * 60 * 60 * 1000;
  return ts > cutoff;
}

function daysCopy(days: number): string {
  if (days >= 365) return `${Math.floor(days / 30)}개월째`;
  if (days >= 60) return `${Math.floor(days / 30)}개월 전`;
  if (days >= 30) return `약 ${Math.floor(days / 7)}주 전`;
  return `${days}일 전`;
}

export default function RevisitNudge({ candidates }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [dismissed, setDismissed] = useState<DismissMap>({});

  useEffect(() => {
    setDismissed(loadDismissed());
    setHydrated(true);
  }, []);

  if (!hydrated || candidates.length === 0) return null;

  const active = candidates.find((c) => !isStillSnoozed(dismissed[c.id]));
  if (!active) return null;

  function snooze() {
    const next = { ...dismissed, [active!.id]: Date.now() };
    setDismissed(next);
    saveDismissed(next);
  }

  const s = categoryStyle(active.category);

  return (
    <section className="px-[18px] mt-3">
      <Link
        href={`/restaurants/${active.id}`}
        className="relative rounded-2xl overflow-hidden flex items-stretch transition-transform active:scale-[0.99]"
        style={{
          background: "var(--surface)",
          boxShadow: "var(--shadow-1)",
          border: "0.5px solid color-mix(in srgb, var(--accent) 25%, transparent)",
        }}
      >
        <div className="relative shrink-0" style={{ width: 84 }}>
          {active.storage_path ? (
            <Image
              src={`${IMAGE_BASE}/${active.storage_path}`}
              alt={active.name}
              fill
              sizes="84px"
              className="object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-[34px]"
              style={{ background: s.gradient }}
            >
              {s.emoji}
            </div>
          )}
        </div>

        <div className="flex-1 py-3 pl-3 pr-9 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: "var(--accent-soft)", color: "var(--accent-press)" }}
            >
              <Sym name="sparkles" size={9} /> 다시 가볼래요?
            </span>
            {active.is_favorite && (
              <Sym name="heart.fill" size={12} className="text-[var(--accent)]" />
            )}
          </div>
          <div className="font-display text-[17px] font-extrabold truncate mt-0.5">
            {active.name}
          </div>
          <div className="text-[12px]" style={{ color: "var(--text-2)" }}>
            {active.category ?? "기타"} · 마지막 방문 {daysCopy(active.days_since)}
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            snooze();
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: "var(--bg)", color: "var(--text-2)" }}
          aria-label="이 추천 일주일 동안 안 보기"
        >
          <Sym name="xmark" size={12} strokeWidth={2.4} />
        </button>
      </Link>
    </section>
  );
}

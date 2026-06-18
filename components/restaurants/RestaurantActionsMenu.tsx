"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Sym from "@/components/ui/Sym";

interface Props {
  restaurantId: string;
  restaurantName: string;
  /**
   * Server action that deletes the restaurant. Takes the id explicitly
   * (avoid closure capture in server actions — Next.js production builds
   * can mishandle it). Returns ok/error so we control navigation here.
   */
  deleteAction: (restaurantId: string) => Promise<{ ok: true } | { error: string }>;
  ensureShareToken: (id: string) => Promise<string>;
}

export default function RestaurantActionsMenu({ restaurantId, restaurantName, deleteAction, ensureShareToken }: Props) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function share() {
    setOpen(false);
    let url = window.location.href;
    try {
      const token = await ensureShareToken(restaurantId);
      url = `${window.location.origin}/r/${token}`;
    } catch {
      // Fallback to current URL (auth-gated) if token creation fails
    }

    if (navigator.share) {
      try {
        await navigator.share({ title: restaurantName, url });
        return;
      } catch {
        // user cancelled, fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      alert("공유 링크가 복사됐어요\n(누구나 볼 수 있는 공개 페이지)");
    } catch {
      alert("공유에 실패했어요");
    }
  }

  function edit() {
    setOpen(false);
    router.push(`/restaurants/${restaurantId}/edit`);
  }

  function rerank() {
    setOpen(false);
    router.push(`/restaurants/${restaurantId}/rank?mode=rerank`);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await deleteAction(restaurantId);
      if ("error" in res) {
        alert(res.error);
        return;
      }
      // Navigate to home after a successful delete.
      router.push("/");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="더보기"
        onClick={() => setOpen((v) => !v)}
        className="relative w-[38px] h-[38px] rounded-full overflow-hidden flex items-center justify-center glass"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.18)", color: "var(--text)" }}
      >
        <Sym name="ellipsis" size={18} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-12 z-30 rounded-2xl overflow-hidden bg-white"
          style={{
            minWidth: 180,
            boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
          }}
        >
          <MenuItem onClick={edit} icon="square.and.pencil" label="수정" />
          <MenuItem onClick={rerank} icon="sparkles" label="다시 비교하기" />
          <MenuItem onClick={share} icon="arrow.up.right" label="공유" />
          <Divider />
          <MenuItem
            onClick={() => { setOpen(false); setConfirming(true); }}
            icon="trash"
            label="삭제"
            danger
          />
        </div>
      )}

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => !deleting && setConfirming(false)}
        >
          <div
            className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[17px] font-bold">정말 삭제할까요?</h3>
            <p className="text-[14px]" style={{ color: "var(--text-2)" }}>
              &quot;{restaurantName}&quot; 과 관련된 사진, 방문 기록도 함께 사라져요.
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setConfirming(false)}
                disabled={deleting}
                className="flex-1 h-[44px] rounded-2xl font-semibold disabled:opacity-50"
                style={{ background: "var(--bg)", color: "var(--text)" }}
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 h-[44px] rounded-2xl text-white font-semibold disabled:opacity-50"
                style={{ background: "#FF3B30" }}
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ComponentProps<typeof Sym>["name"];
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 h-[48px] text-left hover:opacity-70 active:opacity-60"
      style={{ color: danger ? "#FF3B30" : "var(--text)" }}
    >
      <Sym name={icon} size={18} />
      <span className="text-[15px] font-medium">{label}</span>
    </button>
  );
}

function Divider() {
  return <div className="h-px" style={{ background: "var(--separator)" }} />;
}

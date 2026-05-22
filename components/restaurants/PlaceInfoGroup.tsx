// components/restaurants/PlaceInfoGroup.tsx
// 영업 시간 / 전화 / 주소 그룹 — replaces the old "정보" list on the detail page.

import Link from "next/link";
import Sym from "@/components/ui/Sym";
import type { BusinessHours } from "@/lib/types";
import { Group, ListRow } from "@/components/ui/Group";

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

function hoursStatus(hours: BusinessHours | null) {
  if (!hours) return null;
  const now = new Date();
  const todayKey = WEEKDAYS[now.getDay()];
  const todayStr = hours[todayKey];
  if (!todayStr || todayStr === "휴무") {
    return { open: false, text: `오늘은 휴무 · ${WEEKDAY_KO[now.getDay()]}요일` };
  }
  const m = todayStr.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const [, oh, om, ch, cm] = m;
  const open = parseInt(oh) * 60 + parseInt(om);
  const close = parseInt(ch) * 60 + parseInt(cm);
  const cur = now.getHours() * 60 + now.getMinutes();
  if (cur >= open && cur < close) {
    return { open: true, text: `${ch}:${cm}에 영업 종료` };
  }
  return { open: false, text: cur < open ? `${oh}:${om}에 영업 시작` : "영업 종료" };
}

function fmtPhone(p: string) {
  // 02-1234-5678 etc. — only light formatting; pass through if already nice.
  return p.replace(/\s+/g, "");
}

export default function PlaceInfoGroup({
  address,
  phone,
  hours,
  placeUrl,
  syncedAt,
}: {
  address: string | null;
  phone: string | null;
  hours: BusinessHours | null;
  placeUrl: string | null;
  syncedAt: string | null;
}) {
  const status = hoursStatus(hours);
  const hasAnything = address || phone || hours || placeUrl;
  if (!hasAnything) return null;

  return (
    <>
      <Group>
        {(hours || placeUrl) && (
          <ListRow
            icon="calendar"
            label={
              <span className="flex items-center gap-1.5">
                영업 시간
                {status && (
                  <span
                    className="px-1.5 py-[2px] rounded text-[10.5px] font-bold"
                    style={{
                      background: status.open ? "rgba(48,166,86,0.14)" : "rgba(180,30,30,0.12)",
                      color: status.open ? "#208A40" : "#A22424",
                      letterSpacing: 0.2,
                    }}
                  >
                    {status.open ? "영업 중" : "영업 종료"}
                  </span>
                )}
              </span>
            }
            detail={status?.text}
            trailing={placeUrl ? <Sym name="chevron.right" size={14} /> : undefined}
          />
        )}
        {phone && (
          <a
            href={`tel:${fmtPhone(phone)}`}
            className="block transition-colors active:bg-black/[0.03]"
          >
            <ListRow
              icon="mappin"
              label={phone}
              detail="탭하면 전화 걸기"
              trailing={<Sym name="chevron.right" size={14} />}
            />
          </a>
        )}
        {address && (
          <ListRow
            icon="map.fill"
            label={address}
            trailing={<Sym name="chevron.right" size={14} />}
          />
        )}
      </Group>

      {syncedAt && (
        <div className="mt-1.5 px-2 flex items-center gap-1 text-[11px]" style={{ color: "var(--text-2)" }}>
          <Sym name="sparkles" size={11} />
          카카오맵에서 자동 동기화 · {relativeSync(syncedAt)}
        </div>
      )}
    </>
  );
}

function relativeSync(iso: string) {
  const d = new Date(iso);
  const m = Math.round((Date.now() - d.getTime()) / 60000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}시간 전`;
  const days = Math.round(h / 24);
  return `${days}일 전`;
}

import { Visit } from "@/lib/types";

function formatDate(d: string) {
  const date = new Date(d);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  return `${month}/${day} (${weekday})`;
}

export default function VisitList({ visits }: { visits: Visit[] }) {
  if (visits.length === 0) {
    return (
      <p className="text-[14px] text-center py-4" style={{ color: "var(--text-2)" }}>
        방문 기록이 없어요
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {visits.map((v, i) => (
        <li
          key={v.id}
          className="flex items-start gap-3 py-2.5"
          style={{
            borderTop: i > 0 ? "1px solid var(--separator)" : "none",
          }}
        >
          <div
            className="text-[12px] font-semibold whitespace-nowrap pt-0.5 w-[60px]"
            style={{ color: "var(--text-2)" }}
          >
            {formatDate(v.visited_at)}
          </div>
          <div className="text-[14px] flex-1" style={{ color: "var(--text)" }}>
            {v.memo || (
              <span style={{ color: "var(--text-2)" }}>—</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

import { Visit } from "@/lib/types";

export default function VisitList({ visits }: { visits: Visit[] }) {
  if (visits.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">방문 기록이 없어요</p>;
  }

  return (
    <div className="space-y-2">
      {visits.map((v) => (
        <div key={v.id} className="flex items-start gap-3 py-2 border-t border-gray-100">
          <div className="text-xs text-gray-400 whitespace-nowrap pt-0.5 w-20">{v.visited_at}</div>
          <div className="text-sm text-gray-700">{v.memo || "—"}</div>
        </div>
      ))}
    </div>
  );
}

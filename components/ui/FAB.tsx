import Link from "next/link";
import Sym from "./Sym";

export default function FAB({ href = "/restaurants/new" }: { href?: string }) {
  return (
    <Link
      href={href}
      aria-label="맛집 추가"
      className="fixed right-5 bottom-28 z-25 w-14 h-14 rounded-full flex items-center justify-center text-white"
      style={{
        background: "var(--accent)",
        boxShadow:
          "0 10px 22px rgba(255,111,61,0.4), inset 0 1px 0 rgba(255,255,255,0.35)",
      }}
    >
      <Sym name="plus" size={26} strokeWidth={2.4} />
    </Link>
  );
}

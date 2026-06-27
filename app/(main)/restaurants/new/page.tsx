import Link from "next/link";
import RestaurantForm from "@/components/restaurants/RestaurantForm";
import { createRestaurant } from "./create-action";

export default function NewRestaurantPage() {
  return (
    <>
      <div style={{ height: 48 }} />

      <div className="flex items-center justify-between px-5 pt-3.5 pb-1">
        <Link href="/" className="text-[15px]" style={{ color: "var(--text-2)" }}>
          취소
        </Link>
        <span
          className="text-[17px] font-bold"
          style={{ letterSpacing: "-0.3px" }}
        >
          새 맛집
        </span>
        <span style={{ width: 32 }} />
      </div>

      <div className="px-4 pt-4">
        <RestaurantForm action={createRestaurant} />
      </div>
    </>
  );
}

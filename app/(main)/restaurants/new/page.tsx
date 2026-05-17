import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import RestaurantForm from "@/components/restaurants/RestaurantForm";
import Sym from "@/components/ui/Sym";

export default function NewRestaurantPage() {
  async function createRestaurant(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data, error } = await supabase
      .from("restaurants")
      .insert({
        user_id: user.id,
        name: formData.get("name") as string,
        address: (formData.get("address") as string) || null,
        lat: formData.get("lat") ? parseFloat(formData.get("lat") as string) : null,
        lng: formData.get("lng") ? parseFloat(formData.get("lng") as string) : null,
        category: (formData.get("category") as string) || null,
        rating: formData.get("rating")
          ? parseInt(formData.get("rating") as string)
          : null,
        note: (formData.get("note") as string) || null,
      })
      .select()
      .single();

    if (error) throw error;
    redirect(`/restaurants/${data.id}`);
  }

  return (
    <>
      <div style={{ height: 48 }} />

      {/* Sheet-style nav */}
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

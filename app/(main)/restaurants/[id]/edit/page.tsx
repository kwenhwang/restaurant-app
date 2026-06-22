import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RestaurantForm from "@/components/restaurants/RestaurantForm";
import { updateRestaurant } from "../update-action";

export default async function EditRestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!restaurant) notFound();

  // Bind id at the page boundary so the form callback only needs to pass
  // formData. The id travels as a closure binding into the function React
  // serializes for the server-action call.
  const action = updateRestaurant.bind(null, id);

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">맛집 수정</h2>
      <RestaurantForm action={action} restaurant={restaurant} />
    </div>
  );
}

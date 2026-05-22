"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteImage } from "@/lib/storage";

/**
 * Delete the current user and ALL their data:
 * - restaurants + cascade (restaurant_images, visits)
 * - bug_reports (own only)
 * - MinIO photos (restaurant_images + bug_report screenshots)
 * - auth.users row (via service role admin.deleteUser)
 */
export async function deleteAccount(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const userId = user.id;
  const admin = createAdminClient();

  // 1. Collect all MinIO paths to clean up
  const [{ data: images }, { data: bugs }] = await Promise.all([
    admin
      .from("restaurant_images")
      .select("storage_path, restaurants!inner(user_id)")
      .eq("restaurants.user_id", userId),
    admin
      .from("bug_reports")
      .select("screenshot_path")
      .eq("user_id", userId)
      .not("screenshot_path", "is", null),
  ]);

  const paths: string[] = [
    ...((images ?? []) as { storage_path: string }[]).map((i) => i.storage_path),
    ...((bugs ?? []) as { screenshot_path: string }[]).map((b) => b.screenshot_path),
  ];

  // 2. Delete DB rows (cascade handles restaurant_images + visits)
  await admin.from("bug_reports").delete().eq("user_id", userId);
  await admin.from("restaurants").delete().eq("user_id", userId);
  await admin.from("visits").delete().eq("user_id", userId); // safety net

  // 3. Delete MinIO objects (best-effort, ignore failures)
  for (const p of paths) {
    await deleteImage(p).catch(() => {});
  }

  // 4. Delete the auth user (this also signs them out)
  await admin.auth.admin.deleteUser(userId);

  // 5. Redirect to login (signed out)
  redirect("/login");
}

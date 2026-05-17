import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("restaurants")
    .select("menu")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    hasMenu: !!(data?.menu && (data.menu as { items?: unknown[] }).items?.length),
  });
}

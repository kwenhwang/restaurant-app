import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ShareReceiveClient from "@/components/capture/ShareReceiveClient";

interface PageProps {
  searchParams: Promise<{ title?: string; text?: string; url?: string }>;
}

export const metadata = { title: "공유받은 가게 | 맛집 기록장" };

export default async function ShareReceivePage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  // Combine all text inputs — different apps pass them differently
  const combined = [sp.title, sp.text, sp.url].filter(Boolean).join(" ");

  return <ShareReceiveClient initialText={combined} />;
}

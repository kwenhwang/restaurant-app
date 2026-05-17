"use server";

import { createClient } from "@/lib/supabase/server";

interface SubmitInput {
  message: string;
  url?: string;
  userAgent?: string;
}

export async function submitBugReport(input: SubmitInput): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const message = (input.message ?? "").trim();
  if (message.length < 3) throw new Error("내용을 더 자세히 적어 주세요");
  if (message.length > 2000) throw new Error("내용이 너무 길어요 (2000자)");

  const { error } = await supabase.from("bug_reports").insert({
    user_id: user.id,
    message,
    url: input.url?.slice(0, 500) ?? null,
    user_agent: input.userAgent?.slice(0, 500) ?? null,
  });

  if (error) throw error;
}

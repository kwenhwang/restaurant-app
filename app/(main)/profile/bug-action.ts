"use server";

import { createClient } from "@/lib/supabase/server";
import { uploadImage, deleteImage } from "@/lib/storage";

const MAX_BYTES = 5 * 1024 * 1024;

export async function submitBugReport(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const message = ((formData.get("message") as string) ?? "").trim();
  if (message.length < 3) throw new Error("내용을 더 자세히 적어 주세요");
  if (message.length > 2000) throw new Error("내용이 너무 길어요 (2000자)");

  const url = (formData.get("url") as string) ?? null;
  const userAgent = (formData.get("userAgent") as string) ?? null;
  const file = formData.get("file");

  // Optional screenshot upload to MinIO
  let screenshotPath: string | null = null;
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      throw new Error("이미지 파일만 업로드 가능해요");
    }
    if (file.size > MAX_BYTES) {
      throw new Error("이미지가 너무 커요 (최대 5MB)");
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `bug-reports/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      await uploadImage(path, buffer, file.type || "image/jpeg");
      screenshotPath = path;
    } catch {
      throw new Error("이미지 업로드 실패");
    }
  }

  const { error } = await supabase.from("bug_reports").insert({
    user_id: user.id,
    message,
    url: url?.slice(0, 500) ?? null,
    user_agent: userAgent?.slice(0, 500) ?? null,
    screenshot_path: screenshotPath,
  });

  if (error) {
    if (screenshotPath) await deleteImage(screenshotPath).catch(() => {});
    throw error;
  }
}

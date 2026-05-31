import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LargeTitle } from "@/components/ui/LargeTitle";
import {
  updateCollection,
  deleteCollection,
} from "../../actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCollectionPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: c } = await supabase
    .from("collections")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!c) notFound();

  async function handleDelete() {
    "use server";
    await deleteCollection(id);
  }

  return (
    <div className="pb-24">
      <LargeTitle eyebrow="컬렉션 편집" title="설정" />

      <form action={updateCollection} className="px-[18px] space-y-4 mt-2">
        <input type="hidden" name="id" value={c.id} />
        <div
          className="p-4 rounded-2xl space-y-3"
          style={{ background: "var(--surface)", boxShadow: "var(--shadow-1)" }}
        >
          <label className="block">
            <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "var(--text-2)" }}>
              이름
            </span>
            <input
              type="text"
              name="name"
              required
              maxLength={60}
              defaultValue={c.name}
              className="mt-1 w-full bg-transparent border-0 outline-none text-[18px] font-display font-bold"
            />
          </label>
          <label className="block">
            <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "var(--text-2)" }}>
              설명
            </span>
            <textarea
              name="description"
              maxLength={280}
              rows={3}
              defaultValue={c.description ?? ""}
              className="mt-1 w-full bg-transparent border-0 outline-none text-[15px] resize-none"
            />
          </label>
          <label className="flex items-center gap-2 mt-2">
            <input type="checkbox" name="is_public" defaultChecked={c.is_public} className="w-4 h-4" />
            <span className="text-[14px]">공개 리스트 (링크로 공유 가능)</span>
          </label>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/collections/${id}`}
            className="flex-1 h-12 rounded-full text-[15px] font-bold flex items-center justify-center"
            style={{ background: "var(--surface)", color: "var(--text)" }}
          >
            취소
          </Link>
          <button
            type="submit"
            className="flex-1 h-12 rounded-full text-[15px] font-bold text-white"
            style={{ background: "var(--accent)" }}
          >
            저장
          </button>
        </div>
      </form>

      <form action={handleDelete} className="px-[18px] mt-8">
        <button
          type="submit"
          className="w-full h-11 rounded-full text-[13px] font-bold"
          style={{ background: "var(--surface)", color: "#D14343" }}
        >
          컬렉션 삭제
        </button>
      </form>
    </div>
  );
}

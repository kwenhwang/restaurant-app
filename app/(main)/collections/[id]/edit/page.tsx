import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LargeTitle } from "@/components/ui/LargeTitle";
import CollectionForm from "@/components/collections/CollectionForm";
import DeleteCollectionButton from "@/components/collections/DeleteCollectionButton";
import { updateCollection, deleteCollection } from "../../actions";

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

  // Bind id at the page boundary instead of capturing it via inline
  // closure — same defensive pattern as deleteRestaurant.
  const handleDelete = deleteCollection.bind(null, id);

  return (
    <div className="pb-24">
      <LargeTitle eyebrow="컬렉션 편집" title="설정" />
      <CollectionForm
        mode="edit"
        action={updateCollection}
        cancelHref={`/collections/${id}`}
        initial={{
          id: c.id,
          name: c.name,
          description: c.description,
          is_public: c.is_public,
        }}
      />
      <div className="px-[18px] mt-8">
        <DeleteCollectionButton action={handleDelete} />
      </div>
    </div>
  );
}

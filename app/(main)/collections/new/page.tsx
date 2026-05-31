import { LargeTitle } from "@/components/ui/LargeTitle";
import CollectionForm from "@/components/collections/CollectionForm";
import { createCollection } from "../actions";

export default function NewCollectionPage() {
  return (
    <div className="pb-24">
      <LargeTitle eyebrow="새 컬렉션" title="리스트 만들기" />
      <CollectionForm
        mode="create"
        action={createCollection}
        cancelHref="/collections"
      />
    </div>
  );
}

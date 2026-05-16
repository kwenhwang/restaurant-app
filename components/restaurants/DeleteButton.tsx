"use client";

export default function DeleteButton({ action }: { action: () => Promise<void> }) {
  async function handleClick() {
    if (!confirm("정말 삭제하시겠어요?")) return;
    await action();
  }

  return (
    <button
      onClick={handleClick}
      className="text-sm text-red-500 hover:text-red-700 px-3 py-1.5 border border-red-200 rounded-lg"
    >
      삭제
    </button>
  );
}

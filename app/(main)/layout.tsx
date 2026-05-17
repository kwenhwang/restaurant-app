import TabBar from "@/components/ui/TabBar";

/**
 * Main layout — Apple HIG mobile shell.
 * The previous top header navigation is replaced by a bottom Liquid Glass
 * tab bar (defined in components/ui/TabBar). User identity / logout live
 * under the Profile tab.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <main
        className="mx-auto max-w-[640px]"
        style={{ paddingBottom: "120px" /* clear the tab bar */ }}
      >
        {children}
      </main>
      <TabBar />
    </div>
  );
}

import TabBar from "@/components/ui/TabBar";
import PullToRefresh from "@/components/ui/PullToRefresh";
import OfflineBanner from "@/components/ui/OfflineBanner";

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
      <OfflineBanner />
      <PullToRefresh />
      <main
        className="mx-auto max-w-[640px]"
        style={{ paddingBottom: "160px" /* clear FAB(124px) + safe area */ }}
      >
        {children}
      </main>

      {/* Bottom scrim — solid surface behind the TabBar so content
          doesn't peek through when scrolling under it */}
      <div
        className="fixed left-0 right-0 bottom-0 z-20 pointer-events-none"
        style={{
          height: 110,
          background:
            "linear-gradient(to top, var(--bg) 0%, var(--bg) 70%, rgba(242,242,247,0) 100%)",
        }}
      />

      <TabBar />
    </div>
  );
}

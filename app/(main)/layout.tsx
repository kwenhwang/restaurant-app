import TabBar from "@/components/ui/TabBar";
import PullToRefresh from "@/components/ui/PullToRefresh";
import OfflineBanner from "@/components/ui/OfflineBanner";

/**
 * Main layout — mobile shell.
 * Bottom Liquid Glass tab bar (components/ui/TabBar). User identity / logout
 * live under the Profile tab.
 * v3: <main> is the skip-link target (#main-content) and a labelled landmark.
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
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-[640px] outline-none"
        style={{ paddingBottom: "160px" /* clear FAB(124px) + safe area */ }}
      >
        {children}
      </main>

      {/* Bottom scrim — solid surface behind the TabBar so content
          doesn't peek through when scrolling under it */}
      <div
        aria-hidden="true"
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

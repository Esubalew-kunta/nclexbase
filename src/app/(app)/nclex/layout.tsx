import { Sidebar } from "@/components/shell/Sidebar";
import { MobileNav, TopBar, TopBarFrame } from "@/components/shell/TopBar";
import { ContactWidget } from "@/components/shell/ContactWidget";
import { CreateTestModal } from "@/components/test/CreateTestModal";

/**
 * Live layout: 256px sidebar, then a gradient panel (top-left radius 8px) that
 * stays fixed while the content scrolls inside it under a 72px top bar.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh overflow-hidden bg-shell">
      <Sidebar />
      <MobileNav />
      <div className="bg-app-gradient relative h-dvh lg:ml-64 lg:rounded-tl-lg">
        <TopBarFrame>
          <TopBar />
        </TopBarFrame>
        <div id="app-scroll" className="h-dvh overflow-y-auto pt-[72px]">
          <main className="mx-0 px-4 pt-4 pb-20 sm:mx-4 sm:px-8">{children}</main>
        </div>
      </div>
      <CreateTestModal />
      <ContactWidget />
    </div>
  );
}

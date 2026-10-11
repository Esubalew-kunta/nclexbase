import { Sidebar } from "@/components/shell/Sidebar";
import { MobileNav, TopBar, TopBarFrame } from "@/components/shell/TopBar";
import { ContactWidget } from "@/components/shell/ContactWidget";
import { Announcement } from "@/components/shell/Announcement";
import { StudentGuard } from "@/components/shell/StudentGuard";
import { CreateTestModal } from "@/components/test/CreateTestModal";

/**
 * 256px white sidebar, then the off-white content panel that stays fixed while the
 * content scrolls inside it under a 72px top bar.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <StudentGuard>
      <div className="h-dvh overflow-hidden bg-background">
        <Sidebar />
        <MobileNav />
        <div className="relative h-dvh bg-background lg:ml-64">
          <TopBarFrame>
            <TopBar />
          </TopBarFrame>
          <div id="app-scroll" className="h-dvh overflow-y-auto pt-[72px]">
            <main className="mx-0 px-4 pt-4 pb-20 sm:mx-4 sm:px-8">
              <Announcement />
              {children}
            </main>
          </div>
        </div>
        <CreateTestModal />
        <ContactWidget />
      </div>
    </StudentGuard>
  );
}

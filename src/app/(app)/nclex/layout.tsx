import { Sidebar } from "@/components/shell/Sidebar";
import { MobileNav, TopBar } from "@/components/shell/TopBar";
import { CreateTestModal } from "@/components/test/CreateTestModal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-shell">
      <Sidebar />
      <MobileNav />
      <div className="bg-app-gradient min-h-dvh lg:ml-64">
        <div className="mx-auto max-w-[1184px] px-4 pb-24 sm:px-8 lg:px-12">
          <TopBar />
          <main className="pt-4">{children}</main>
        </div>
      </div>
      <CreateTestModal />
    </div>
  );
}

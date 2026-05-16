import { ReactNode } from "react";
import Sidebar from "../components/Sidebar";

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayout({
  children,
}: MainLayoutProps) {
  return (
    <div className="flex bg-black text-white min-h-screen">
      <Sidebar />

      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

export default MainLayout;
import Sidebar from "../components/Sidebar";

interface Props {
  children: React.ReactNode;
}

function MainLayout({
  children,
}: Props) {
  return (
    <div className="min-h-screen bg-black text-white lg:flex">
      {/* SIDEBAR */}

      <Sidebar />

      {/* MAIN CONTENT */}

      <main className="flex-1 w-full p-4 md:p-6 lg:p-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

export default MainLayout;
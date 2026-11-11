import Sidebar from "../components/Sidebar";

interface Props {
  children: React.ReactNode;
}

function MainLayout({
  children,
}: Props) {
  return (
    <div className="min-h-screen text-white lg:flex">
      {/* SIDEBAR */}

      <Sidebar />

      {/* MAIN CONTENT */}

      <main className="flex-1 w-full p-4 md:p-6 lg:p-10 overflow-x-hidden">
        <div className="page-enter mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}

export default MainLayout;

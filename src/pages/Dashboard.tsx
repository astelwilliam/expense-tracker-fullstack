import MainLayout from "../layouts/MainLayout";

function Dashboard() {
  return (
    <MainLayout>
      <h1 className="text-4xl font-bold mb-6">
        Dashboard
      </h1>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-zinc-900 p-6 rounded-2xl">
          <h2 className="text-zinc-400 mb-2">
            Total Balance
          </h2>

          <p className="text-3xl font-bold">
            ₹25,000
          </p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-2xl">
          <h2 className="text-zinc-400 mb-2">
            Income
          </h2>

          <p className="text-3xl font-bold text-green-500">
            ₹40,000
          </p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-2xl">
          <h2 className="text-zinc-400 mb-2">
            Expenses
          </h2>

          <p className="text-3xl font-bold text-red-500">
            ₹15,000
          </p>
        </div>
      </div>
    </MainLayout>
  );
}

export default Dashboard;
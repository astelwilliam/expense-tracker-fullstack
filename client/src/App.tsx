import { lazy, Suspense, type ReactNode } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Analytics = lazy(() => import("./pages/Analytics"));
import Login from "./pages/Login";
import Signup from "./pages/Signup";
const SmartImport = lazy(() => import("./pages/SmartImport"));
const SmartAssist = lazy(() => import("./pages/SmartAssist"));

import ProtectedRoute from "./components/ProtectedRoute";
import { SmartImportProvider } from "./context/SmartImportContext";

function App() {
  const protectedPage = (page: ReactNode) => (
    <ProtectedRoute><Suspense fallback={<div className="min-h-screen bg-[#07110f] p-8 text-zinc-300" role="status">Loading workspace…</div>}>{page}</Suspense></ProtectedRoute>
  );
  return (
    <SmartImportProvider>
      <BrowserRouter>
        <Routes>
        <Route
          path="/"
          element={protectedPage(<Dashboard />)}
        />

        <Route
          path="/transactions"
          element={protectedPage(<Transactions />)}
        />

        <Route
          path="/analytics"
          element={protectedPage(<Analytics />)}
        />
        <Route path="/smart-import" element={protectedPage(<SmartImport />)} />
        <Route path="/smart-assist" element={protectedPage(<SmartAssist />)} />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />
        </Routes>
      </BrowserRouter>
    </SmartImportProvider>
  );
}

export default App;

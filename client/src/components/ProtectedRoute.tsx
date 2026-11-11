import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { isAuthenticated } from "../utils/auth";
import { TransactionProvider } from "../context/TransactionContext";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return <TransactionProvider>{children}</TransactionProvider>;
}

/* eslint-disable react-refresh/only-export-components -- Provider and consumer hook share a context. */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import api from "../services/api";

export interface Transaction {
  _id: string;
  title: string;
  amount: number; // Signed: income is positive, expense is negative.
  category: string;
  type?: "income" | "expense"; // Optional on transactions created before V1.1.
  createdAt: string;
  transactionDate?: string;
}

export type TransactionInput = Pick<Transaction, "title" | "amount" | "category"> & { transactionDate?: string };

interface TransactionContextType {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
  addTransaction: (transaction: TransactionInput) => Promise<void>;
  updateTransaction: (id: string, transaction: TransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get<Transaction[]>("/transactions");
      setTransactions(response.data);
    } catch (err) {
      setError("Unable to load transactions. Try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // An async API callback avoids synchronous setState inside an effect.
    let active = true;
    api.get<Transaction[]>("/transactions")
      .then(({ data }) => {
        if (!active) return;
        setTransactions(data);
        setError(null);
      })
      .catch(() => {
        if (active) setError("Unable to load transactions. Try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const addTransaction = async (transaction: TransactionInput) => {
    const response = await api.post<Transaction>("/transactions", transaction);
    setTransactions((current) => [response.data, ...current]);
  };

  const updateTransaction = async (id: string, transaction: TransactionInput) => {
    const response = await api.put<Transaction>(`/transactions/${id}`, transaction);
    setTransactions((current) => current.map((item) => item._id === id ? response.data : item));
  };

  const deleteTransaction = async (id: string) => {
    await api.delete(`/transactions/${id}`);
    setTransactions((current) => current.filter((item) => item._id !== id));
  };

  return (
    <TransactionContext.Provider value={{
      transactions, loading, error, fetchTransactions,
      addTransaction, updateTransaction, deleteTransaction,
    }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (!context) throw new Error("useTransactions must be used within TransactionProvider");
  return context;
}

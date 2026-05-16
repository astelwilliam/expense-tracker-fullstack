import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import api from "../services/api";

interface Transaction {
  _id: string;
  title: string;
  amount: number;
}

interface TransactionContextType {
  transactions: Transaction[];

  addTransaction: (
    title: string,
    amount: number
  ) => Promise<void>;

  deleteTransaction: (
    id: string
  ) => Promise<void>;
}

const TransactionContext =
  createContext<TransactionContextType | null>(
    null
  );

interface TransactionProviderProps {
  children: ReactNode;
}

export function TransactionProvider({
  children,
}: TransactionProviderProps) {
  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  // FETCH TRANSACTIONS
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions =
    async () => {
      try {
        const response =
          await api.get(
            "/transactions"
          );

        setTransactions(
          response.data
        );
      } catch (error) {
        console.log(error);
      }
    };

  // ADD TRANSACTION
  const addTransaction =
    async (
      title: string,
      amount: number
    ) => {
      try {
        const response =
          await api.post(
            "/transactions",
            {
              title,
              amount,
            }
          );

        setTransactions([
          response.data,
          ...transactions,
        ]);
      } catch (error) {
        console.log(error);
      }
    };

  // DELETE TRANSACTION
  const deleteTransaction =
    async (id: string) => {
      try {
        await api.delete(
          `/transactions/${id}`
        );

        setTransactions(
          transactions.filter(
            (transaction) =>
              transaction._id !== id
          )
        );
      } catch (error) {
        console.log(error);
      }
    };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        addTransaction,
        deleteTransaction,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context =
    useContext(TransactionContext);

  if (!context) {
    throw new Error(
      "useTransactions must be used within TransactionProvider"
    );
  }

  return context;
}
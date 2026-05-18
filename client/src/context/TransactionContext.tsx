import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";

export interface Transaction {
  _id?: string;
  title: string;
  amount: number;
  category?: string;
  createdAt?: string;
}

interface TransactionContextType {
  transactions: Transaction[];

  addTransaction: (
    transaction: Transaction
  ) => Promise<void>;

  deleteTransaction: (
    id: string
  ) => Promise<void>;

  fetchTransactions: () => Promise<void>;
}

const TransactionContext =
  createContext<
    TransactionContextType | undefined
  >(undefined);

export const TransactionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [
    transactions,
    setTransactions,
  ] = useState<Transaction[]>(
    []
  );

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

  const addTransaction =
    async (
      transaction: Transaction
    ) => {
      try {
        const response =
          await api.post(
            "/transactions",
            transaction
          );

        setTransactions(
          [
            response.data,
            ...transactions,
          ]
        );
      } catch (error) {
        console.log(error);
      }
    };

  const deleteTransaction =
    async (id: string) => {
      try {
        await api.delete(
          `/transactions/${id}`
        );

        setTransactions(
          transactions.filter(
            (transaction) =>
              transaction._id !==
              id
          )
        );
      } catch (error) {
        console.log(error);
      }
    };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        addTransaction,
        deleteTransaction,
        fetchTransactions,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions =
  () => {
    const context = useContext(
      TransactionContext
    );

    if (!context) {
      throw new Error(
        "useTransactions must be used within TransactionProvider"
      );
    }

    return context;
  };
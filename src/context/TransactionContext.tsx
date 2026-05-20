import React, {
  createContext,
  useContext,
  useState,
} from "react";

interface Transaction {
  _id?: string;
  title: string;
  amount: number;
  type: string;
  category: string;
  date: string;
}

interface TransactionContextType {
  transactions: Transaction[];
  setTransactions: React.Dispatch<
    React.SetStateAction<Transaction[]>
  >;
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
  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        setTransactions,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
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
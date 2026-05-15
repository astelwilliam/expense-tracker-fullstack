import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface Transaction {
  id: number;
  title: string;
  amount: number;
}

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (
    title: string,
    amount: number
  ) => void;
  deleteTransaction: (id: number) => void;
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
    useState<Transaction[]>(() => {
      const savedTransactions =
        localStorage.getItem("transactions");

      return savedTransactions
        ? JSON.parse(savedTransactions)
        : [
            {
              id: 1,
              title: "Groceries",
              amount: -2000,
            },
            {
              id: 2,
              title: "Salary",
              amount: 40000,
            },
            {
              id: 3,
              title: "Internet Bill",
              amount: -1200,
            },
          ];
    });

  useEffect(() => {
    localStorage.setItem(
      "transactions",
      JSON.stringify(transactions)
    );
  }, [transactions]);

  const addTransaction = (
    title: string,
    amount: number
  ) => {
    const newTransaction = {
      id: Date.now(),
      title,
      amount,
    };

    setTransactions([
      newTransaction,
      ...transactions,
    ]);
  };

  const deleteTransaction = (id: number) => {
    setTransactions(
      transactions.filter(
        (transaction) => transaction.id !== id
      )
    );
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
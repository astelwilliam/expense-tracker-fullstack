import type { Transaction } from "../context/TransactionContext";

export type TransactionType = "income" | "expense";

export function todayLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateOf(transaction: Transaction): string {
  return transaction.transactionDate || transaction.createdAt.slice(0, 10);
}

export function typeOf(transaction: Transaction): TransactionType {
  return transaction.amount > 0 ? "income" : "expense";
}

export function signedAmount(amount: string, type: TransactionType): number {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error("Enter an amount greater than zero");
  return type === "income" ? parsed : -parsed;
}

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function summarize(transactions: Transaction[]) {
  const income = transactions.reduce((sum, item) => sum + Math.max(0, item.amount), 0);
  const expenses = transactions.reduce((sum, item) => sum + Math.max(0, -item.amount), 0);
  return { income, expenses, balance: income - expenses };
}

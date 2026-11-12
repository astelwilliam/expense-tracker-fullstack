/* eslint-disable react-refresh/only-export-components -- Provider and consumer hook share a context. */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { LOGOUT_EVENT } from "../utils/auth";

export type SmartImportRow = {
  title?: string;
  amount?: number;
  type?: "income" | "expense";
  transactionDate?: string;
  referenceId?: string;
  category: string;
  confidence: string;
  warnings: string[];
  selected: boolean;
  duplicate?: { status: "new" | "exact" | "possible"; reason: string };
};

export type SmartImportResult = {
  candidates: SmartImportRow[];
  warnings: string[];
  pageCount?: number;
};

export type SpreadsheetFormat = "csv" | "xlsx";
export type SpreadsheetPreview = {
  total: number;
  toImport: number;
  alreadyImported: number;
  transactionIds?: { present: number; missing: number };
  preview: Array<{ title: string; category: string; transactionDate: string; amount: number }>;
};
export type SpreadsheetUpload = { filename: string; format: SpreadsheetFormat; data: string };
export type SpreadsheetStatus = "idle" | "previewing" | "ready" | "importing";

type SmartImportContextValue = {
  file?: File;
  previewUrl?: string;
  result?: SmartImportResult;
  spreadsheetUpload?: SpreadsheetUpload;
  spreadsheetPreview?: SpreadsheetPreview;
  spreadsheetStatus: SpreadsheetStatus;
  page: number;
  replaceFile: (file: File) => void;
  isCurrentFile: (file: File) => boolean;
  clearDraft: () => void;
  beginSpreadsheetImport: () => boolean;
  endSpreadsheetImport: () => void;
  setResult: Dispatch<SetStateAction<SmartImportResult | undefined>>;
  setSpreadsheetUpload: Dispatch<SetStateAction<SpreadsheetUpload | undefined>>;
  setSpreadsheetPreview: Dispatch<SetStateAction<SpreadsheetPreview | undefined>>;
  setSpreadsheetStatus: Dispatch<SetStateAction<SpreadsheetStatus>>;
  setPage: Dispatch<SetStateAction<number>>;
};

const SmartImportContext = createContext<SmartImportContextValue | undefined>(undefined);

export function SmartImportProvider({ children }: { children: ReactNode }) {
  const [file, setFile] = useState<File>();
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [result, setResult] = useState<SmartImportResult>();
  const [spreadsheetUpload, setSpreadsheetUpload] = useState<SpreadsheetUpload>();
  const [spreadsheetPreview, setSpreadsheetPreview] = useState<SpreadsheetPreview>();
  const [spreadsheetStatus, setSpreadsheetStatus] = useState<SpreadsheetStatus>("idle");
  const [page, setPage] = useState(1);
  const previewUrlRef = useRef<string | undefined>(undefined);
  const fileRef = useRef<File | undefined>(undefined);
  const spreadsheetImportingRef = useRef(false);

  const releasePreview = useCallback(() => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = undefined;
  }, []);

  const clearDraft = useCallback(() => {
    releasePreview();
    setFile(undefined);
    fileRef.current = undefined;
    setPreviewUrl(undefined);
    setResult(undefined);
    setSpreadsheetUpload(undefined);
    setSpreadsheetPreview(undefined);
    setSpreadsheetStatus("idle");
    spreadsheetImportingRef.current = false;
    setPage(1);
  }, [releasePreview]);

  const replaceFile = useCallback((nextFile: File) => {
    releasePreview();
    const nextUrl = URL.createObjectURL(nextFile);
    previewUrlRef.current = nextUrl;
    setFile(nextFile);
    fileRef.current = nextFile;
    setPreviewUrl(nextUrl);
    setResult(undefined);
    setSpreadsheetUpload(undefined);
    setSpreadsheetPreview(undefined);
    setSpreadsheetStatus("idle");
    spreadsheetImportingRef.current = false;
    setPage(1);
  }, [releasePreview]);

  const isCurrentFile = useCallback((candidate: File) => fileRef.current === candidate, []);

  const beginSpreadsheetImport = useCallback(() => {
    if (spreadsheetImportingRef.current) return false;
    spreadsheetImportingRef.current = true;
    setSpreadsheetStatus("importing");
    return true;
  }, []);

  const endSpreadsheetImport = useCallback(() => {
    spreadsheetImportingRef.current = false;
    setSpreadsheetStatus("ready");
  }, []);

  useEffect(() => {
    window.addEventListener(LOGOUT_EVENT, clearDraft);
    return () => {
      window.removeEventListener(LOGOUT_EVENT, clearDraft);
      releasePreview();
    };
  }, [clearDraft, releasePreview]);

  return <SmartImportContext.Provider value={{
    file, previewUrl, result, spreadsheetUpload, spreadsheetPreview, spreadsheetStatus,
    page, replaceFile, isCurrentFile, clearDraft, beginSpreadsheetImport, endSpreadsheetImport,
    setResult, setSpreadsheetUpload, setSpreadsheetPreview,
    setSpreadsheetStatus, setPage,
  }}>{children}</SmartImportContext.Provider>;
}

export function useSmartImport() {
  const context = useContext(SmartImportContext);
  if (!context) throw new Error("useSmartImport must be used within SmartImportProvider");
  return context;
}

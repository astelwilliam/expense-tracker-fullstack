import { useRef, useState } from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiError } from "../services/api";
import { useTransactions } from "../context/TransactionContext";

const MAX_FILE_BYTES = 1024 * 1024;
type Format = "csv" | "xlsx";
interface Preview {
  total: number;
  toImport: number;
  alreadyImported: number;
  preview: Array<{ title: string; category: string; transactionDate: string; amount: number }>;
}
interface FileToImport { filename: string; format: Format; data: string; }

async function toBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let start = 0; start < bytes.length; start += 32768) {
    binary += String.fromCharCode(...bytes.subarray(start, start + 32768));
  }
  return btoa(binary);
}

export default function TransactionTransfer() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { fetchTransactions } = useTransactions();
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selected, setSelected] = useState<FileToImport | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  async function download(path: string, filename: string) {
    setDownloading(true);
    try {
      const response = await api.get<Blob>(path, { responseType: "blob", timeout: 60000 });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      toast.success("Download ready");
    } catch (err) {
      toast.error(getApiError(err, "Unable to download transactions"));
    } finally { setDownloading(false); }
  }

  async function selectFile(file?: File) {
    setSelected(null);
    setPreview(null);
    if (!file) return;
    const format = file.name.toLowerCase().endsWith(".xlsx") ? "xlsx" : file.name.toLowerCase().endsWith(".csv") ? "csv" : null;
    if (!format) { toast.error("Choose a .xlsx or .csv file"); return; }
    if (file.size === 0 || file.size > MAX_FILE_BYTES) { toast.error("Choose a file smaller than 1 MB"); return; }
    setBusy(true);
    try {
      const upload: FileToImport = { filename: file.name, format, data: await toBase64(file) };
      const response = await api.post<Preview>("/transactions/import/preview", { format: upload.format, data: upload.data }, { timeout: 60000 });
      setSelected(upload);
      setPreview(response.data);
    } catch (err) { toast.error(getApiError(err, "Unable to read this spreadsheet")); }
    finally { setBusy(false); if(inputRef.current) inputRef.current.value = ""; }
  }

  async function confirmImport() {
    if (!selected || !preview || busy || preview.toImport === 0) return;
    setBusy(true);
    try {
      const response = await api.post<{imported:number;alreadyImported:number}>("/transactions/import", {
        format: selected.format, data: selected.data,
      }, {timeout:60000});
      await fetchTransactions();
      toast.success(`Imported ${response.data.imported} transaction(s)`);
      setPreview(null);
      setSelected(null);
    } catch (err) { toast.error(getApiError(err, "Import failed; no changes shown")); }
    finally { setBusy(false); }
  }

  return (
    <section className="bg-zinc-900 p-4 md:p-6 rounded-2xl mb-6" aria-label="Import and export transactions">
      <div className="flex items-center gap-2 mb-2"><FileSpreadsheet size={20} className="text-green-400"/><h2 className="text-lg font-semibold">Import & Export</h2></div>
      <p className="text-sm text-zinc-400 mb-4">Backup your transactions or move data from Excel. Export includes all your transactions (up to 5,000), not just the filtered list.</p>
      <div className="flex flex-wrap gap-3 items-center">
        <button type="button" disabled={downloading} onClick={() => void download("/transactions/export?format=xlsx", "expense-tracker.xlsx")} className="inline-flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-xl font-semibold"><Download size={18}/>Download Excel</button>
        <button type="button" disabled={downloading} onClick={() => void download("/transactions/export?format=csv", "expense-tracker.csv")} className="inline-flex items-center gap-2 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 rounded-xl">Download CSV</button>
        <label className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl font-semibold cursor-pointer ${busy ? "opacity-50 pointer-events-none" : "bg-blue-600 hover:bg-blue-700"}`}>
          <Upload size={18}/>Upload Excel / CSV
          <input ref={inputRef} type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" disabled={busy} onChange={(e) => void selectFile(e.target.files?.[0])} aria-label="Select Excel or CSV file" />
        </label>
        <button type="button" disabled={downloading} className="text-sm text-zinc-300 hover:text-white underline disabled:opacity-50" onClick={() => void download("/transactions/template", "expense-tracker-template.csv")}>Download sample template</button>
      </div>
      <p className="text-xs text-zinc-400 mt-3">Accepted: .xlsx, .csv (max 1 MB, 200 rows/import). Columns: Date (YYYY-MM-DD), Title, Type, Amount, Category; Transaction ID optional. Amounts must be positive, with Income or Expense selected. Invalid files are rejected before importing.</p>
      {busy && <p role="status" className="text-sm mt-3 text-blue-300">Processing spreadsheet…</p>}
      {selected && preview && <div className="mt-5 border border-zinc-700 rounded-xl p-4" role="region" aria-label="Import preview">
        <h3 className="font-semibold mb-2 break-all">Import preview: {selected.filename}</h3>
        <p className="text-sm text-zinc-300 mb-3">{preview.total} row(s) checked · {preview.toImport} new · {preview.alreadyImported} existing IDs skipped</p>
        <ul className="text-sm space-y-1 mb-3 text-zinc-300">{preview.preview.map((row,i)=><li key={i} className="break-words">{row.transactionDate} · {row.title} · {row.category} · {row.amount > 0 ? "+" : "−"}₹{Math.abs(row.amount).toFixed(2)}</li>)}</ul>
        <p className="text-xs text-yellow-300 mb-4">Existing transactions are never overwritten. Files without Transaction IDs can create duplicates if imported again. Review before confirming.</p>
        <div className="flex gap-3 flex-wrap">
          <button type="button" disabled={busy || preview.toImport === 0} onClick={() => void confirmImport()} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 font-semibold">Confirm import ({preview.toImport})</button>
          <button type="button" disabled={busy} onClick={() => {setSelected(null);setPreview(null);}} className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50">Cancel</button>
        </div>
      </div>}
    </section>
  );
}

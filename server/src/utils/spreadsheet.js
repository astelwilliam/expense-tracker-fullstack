// Dependency-free, bounded CSV/XLSX transfer for Excel and spreadsheet apps.
// Imported spreadsheet contents are untrusted. No formulas or external resources are evaluated.
import { deflateRawSync, inflateRawSync } from "node:zlib";
import { validateTransaction } from "./validation.js";

export const MAX_FILE_BYTES = 1024 * 1024;
export const MAX_IMPORT_ROWS = 200;
export const MAX_EXPORT_ROWS = 5000;
export const HEADERS = ["Transaction ID", "Date", "Title", "Type", "Amount", "Category"];
const CATEGORIES = new Map(["Food", "Salary", "Shopping", "Bills", "Travel", "Entertainment", "Other"].map(v => [v.toLowerCase(), v]));

function guardSpreadsheetText(value) {
  // Leading whitespace can be ignored by Excel's formula handling.
  const text = String(value ?? "");
  return /^[\s\u0000-\u001f]*[=+\-@]/.test(text) ? `'${text}` : text;
}
function csvCell(value, text = true) {
  const string = text ? guardSpreadsheetText(value) : String(value ?? "");
  return /[",\r\n]/.test(string) ? `"${string.replaceAll('"', '""')}"` : string;
}
function dateOf(row) { return row.transactionDate || String(row.createdAt ?? "").slice(0, 10); }
function exportRows(transactions) {
  return transactions.map(row => [
    String(row._id ?? ""), dateOf(row), row.title, row.amount > 0 ? "Income" : "Expense",
    Math.abs(row.amount).toFixed(2), row.category,
  ]);
}
export function csvTemplate() {
  return '\uFEFF' + HEADERS.map(h => csvCell(h)).join(',') + '\r\n' + ["", "2026-11-10", "Groceries", "Expense", "250.00", "Food"].map(v => csvCell(v)).join(",") + '\r\n';
}
export function exportCsv(transactions) {
  return '\uFEFF' + [HEADERS, ...exportRows(transactions)].map(row => row.map((cell, i) => csvCell(cell, i !== 4)).join(",")).join('\r\n') + '\r\n';
}

function parseCsv(data) {
  // RFC 4180 fields including escaped quotes and multi-line quoted cells.
  const input = new TextDecoder('utf-8', { fatal: true }).decode(data).replace(/^\uFEFF/, '');
  if (input.includes('\0')) throw new Error('CSV contains invalid characters');
  const rows = [];
  let row = [], cell = '', quoted = false, closed = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"') {
        if (input[i + 1] === '"') { cell += '"'; i++; }
        else { quoted = false; closed = true; }
      } else cell += ch;
    } else if (ch === '"') {
      if (cell !== '' || closed) throw new Error('Malformed CSV quotation');
      quoted = true;
    } else if (ch === ',' || ch === '\n' || ch === '\r') {
      if (cell.length > 2000) throw new Error('CSV cell is too long');
      row.push(cell);
      cell = ''; closed = false;
      if (ch !== ',') {
        if (row.some(v => v !== '')) rows.push(row);
        if (rows.length > MAX_IMPORT_ROWS + 1) throw new Error(`Maximum ${MAX_IMPORT_ROWS} transactions per import`);
        row = [];
        if (ch === '\r' && input[i + 1] === '\n') i++;
      }
    } else {
      if (closed) throw new Error('Unexpected content after CSV quotation');
      cell += ch;
      if (cell.length > 2000) throw new Error('CSV cell is too long');
    }
  }
  if (quoted) throw new Error('Unclosed CSV quoted field');
  if (cell !== '' || row.length) { row.push(cell); if (row.some(v => v !== '')) rows.push(row); }
  return rows;
}

function xmlEscape(value) {
  return String(value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;' })[ch]);
}
function xmlDecode(value) {
  return value.replace(/&(?:amp|lt|gt|quot|apos|#x[\da-fA-F]+|#\d+);/g, entity => {
    const table = { '&amp;':'&', '&lt;':'<', '&gt;':'>', '&quot;':'"', '&apos;':"'" };
    if (table[entity] !== undefined) return table[entity];
    const num = entity.startsWith('&#x') ? parseInt(entity.slice(3, -1), 16) : parseInt(entity.slice(2, -1), 10);
    return num >= 0 && num <= 0x10ffff && !(num >= 0xd800 && num <= 0xdfff) ? String.fromCodePoint(num) : '';
  });
}
// ZIP CRC32; the archive itself is constructed using Node's built-in zlib.
const CRC_TABLE = new Uint32Array(256);
for (let n=0; n<256; n++) { let c=n; for (let k=0; k<8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; CRC_TABLE[n] = c>>>0; }
function crc32(buffer) { let c=0xffffffff; for(const b of buffer) c = CRC_TABLE[(c^b)&0xff] ^ (c>>>8); return (c ^ 0xffffffff) >>> 0; }
function zipFiles(files) {
  const local = [], central = []; let offset=0;
  for (const [name, content] of Object.entries(files)) {
    const filename = Buffer.from(name, 'utf8');
    const raw = Buffer.from(content, 'utf8');
    const compressed = deflateRawSync(raw);
    const crc = crc32(raw);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50,0); localHeader.writeUInt16LE(20,4); localHeader.writeUInt16LE(8,8);
    localHeader.writeUInt32LE(crc,14); localHeader.writeUInt32LE(compressed.length,18); localHeader.writeUInt32LE(raw.length,22);
    localHeader.writeUInt16LE(filename.length,26);
    local.push(localHeader, filename, compressed);
    const directoryHeader = Buffer.alloc(46);
    directoryHeader.writeUInt32LE(0x02014b50,0); directoryHeader.writeUInt16LE(20,4); directoryHeader.writeUInt16LE(20,6);
    directoryHeader.writeUInt16LE(8,10); directoryHeader.writeUInt32LE(crc,16);
    directoryHeader.writeUInt32LE(compressed.length,20); directoryHeader.writeUInt32LE(raw.length,24);
    directoryHeader.writeUInt16LE(filename.length,28); directoryHeader.writeUInt32LE(offset,42);
    central.push(directoryHeader,filename);
    offset += localHeader.length + filename.length + compressed.length;
  }
  const directory = Buffer.concat(central);
  const end=Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50,0); end.writeUInt16LE(Object.keys(files).length,8); end.writeUInt16LE(Object.keys(files).length,10);
  end.writeUInt32LE(directory.length,12); end.writeUInt32LE(offset,16);
  return Buffer.concat([...local, directory, end]);
}

export function exportXlsx(transactions) {
  const rows = [HEADERS, ...exportRows(transactions)];
  const sheetData = rows.map((row,i) => `<row r="${i+1}">${row.map((raw,j) => {
    const ref = `${String.fromCharCode(65+j)}${i+1}`;
    if (i > 0 && j === 4) return `<c r="${ref}" s="2"><v>${Number(raw)}</v></c>`;
    const safe = guardSpreadsheetText(raw);
    return `<c r="${ref}"${i===0?' s="1"':''} t="inlineStr"><is><t xml:space="preserve">${xmlEscape(safe)}</t></is></c>`;
  }).join('')}</row>`).join('');
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:F${rows.length}"/><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="18"/><cols><col min="1" max="1" width="29" customWidth="1"/><col min="2" max="2" width="16" customWidth="1"/><col min="3" max="3" width="34" customWidth="1"/><col min="4" max="4" width="15" customWidth="1"/><col min="5" max="5" width="16" customWidth="1"/><col min="6" max="6" width="19" customWidth="1"/></cols><sheetData>${sheetData}</sheetData><autoFilter ref="A1:F${rows.length}"/></worksheet>`;
  return zipFiles({
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Transactions" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    'xl/styles.xml': `<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF166534"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="1" borderId="0" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs></styleSheet>`,
    'xl/worksheets/sheet1.xml': sheet,
  });
}

function readZip(buffer, targets) {
  if (buffer.length > MAX_FILE_BYTES) throw new Error('Maximum file size is 1 MB');
  let end = -1;
  for(let i=buffer.length-22; i>=Math.max(0,buffer.length-65557); i--) {
    if(buffer.readUInt32LE(i)===0x06054b50) { end=i; break; }
  }
  if(end<0) throw new Error('Invalid Excel file');
  const entries = buffer.readUInt16LE(end+10);
  if(entries > 250) throw new Error('Excel file contains too many parts');
  const cdLen=buffer.readUInt32LE(end+12), cdStart=buffer.readUInt32LE(end+16);
  if(cdStart+cdLen>buffer.length) throw new Error('Invalid Excel ZIP directory');
  const output = new Map(); let cursor=cdStart; let totalBytes=0;
  for(let n=0; n<entries; n++) {
    if(cursor+46>buffer.length || buffer.readUInt32LE(cursor)!==0x02014b50) throw new Error('Invalid Excel ZIP entry');
    const method=buffer.readUInt16LE(cursor+10), flags=buffer.readUInt16LE(cursor+8);
    const size=buffer.readUInt32LE(cursor+24), zipped=buffer.readUInt32LE(cursor+20), crc=buffer.readUInt32LE(cursor+16);
    const namelen=buffer.readUInt16LE(cursor+28), extra=buffer.readUInt16LE(cursor+30), comment=buffer.readUInt16LE(cursor+32);
    const location=buffer.readUInt32LE(cursor+42);
    if(cursor+46+namelen+extra+comment>buffer.length) throw new Error('Invalid Excel ZIP directory');
    const name=buffer.subarray(cursor+46,cursor+46+namelen).toString('utf8');
    cursor += 46+namelen+extra+comment;
    if(!targets.has(name)) continue;
    if((flags & 1) || ![0,8].includes(method) || size>2_000_000 || totalBytes+size>4_000_000 || location+30>buffer.length || buffer.readUInt32LE(location)!==0x04034b50) throw new Error('Unsafe or unsupported Excel file');
    const localLen=buffer.readUInt16LE(location+26), localExtra=buffer.readUInt16LE(location+28), start=location+30+localLen+localExtra;
    if(start+zipped>buffer.length) throw new Error('Invalid Excel ZIP size');
    const compressed=buffer.subarray(start,start+zipped);
    const content=method===0 ? compressed : inflateRawSync(compressed,{maxOutputLength:2_000_000});
    if(content.length!==size || crc32(content)!==crc) throw new Error('Corrupted Excel ZIP entry');
    totalBytes+=size;
    output.set(name,new TextDecoder('utf-8',{fatal:true}).decode(content));
  }
  return output;
}
function getAttr(attributes,name) {
  const match=attributes.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`));
  return match?.[1];
}
function xmlText(text) {
  if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error('Unsafe Excel XML');
  return xmlDecode(text);
}
function parseXlsx(buffer) {
  const entries=readZip(buffer,new Set(['xl/worksheets/sheet1.xml','xl/sharedStrings.xml']));
  const sheet=entries.get('xl/worksheets/sheet1.xml');
  if(!sheet) throw new Error('First worksheet not found');
  if (/<!DOCTYPE|<!ENTITY/i.test(sheet)) throw new Error('Unsafe Excel XML');
  const shared=[];
  const sharedXml=entries.get('xl/sharedStrings.xml');
  if(sharedXml) {
    if(/<!DOCTYPE|<!ENTITY/i.test(sharedXml)) throw new Error('Unsafe Excel XML');
    for (const match of sharedXml.matchAll(/<(?:[\w.-]+:)?si\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?si>/g)) {
      shared.push([...match[1].matchAll(/<(?:[\w.-]+:)?t\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?t>/g)].map(m=>xmlText(m[1])).join(''));
      if(shared.length>20000) throw new Error('Too many Excel shared strings');
    }
  }
  const rows=[];
  for(const match of sheet.matchAll(/<(?:[\w.-]+:)?row\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?row>/g)) {
    const cells=[];
    for(const c of match[1].matchAll(/<(?:[\w.-]+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:[\w.-]+:)?c>)/g)) {
      const ref=getAttr(c[1],'r') || '';
      const col=ref.match(/^[A-Z]+/)?.[0];
      let index=0;
      if(col) { for(const ch of col) index=index*26+ch.charCodeAt(0)-64; index--; }
      else index=cells.length;
      if(index>64) continue;
      if(/<(?:[\w.-]+:)?f(?:\s|>)/.test(c[2] || '')) throw new Error('Excel formulas are not allowed in imported data');
      const type=getAttr(c[1],'t');
      let value='';
      if(type==='inlineStr') value=[...(c[2] || '').matchAll(/<(?:[\w.-]+:)?t\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?t>/g)].map(m=>xmlText(m[1])).join('');
      else {
        const v=(c[2] || '').match(/<(?:[\w.-]+:)?v\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?v>/)?.[1];
        if(v!==undefined) {
          if(type==='s') { const idx=Number(v); if(!Number.isInteger(idx)||idx<0||idx>=shared.length) throw new Error('Invalid shared string'); value=shared[idx]; }
          else value=xmlText(v);
        }
      }
      cells[index]=value;
    }
    rows.push(cells);
    if(rows.length>MAX_IMPORT_ROWS+1) throw new Error(`Maximum ${MAX_IMPORT_ROWS} transactions per import`);
  }
  return rows;
}
function getColumns(header) {
  if(!header?.length) throw new Error('Empty spreadsheet');
  const lookup=new Map(header.map((v,i)=>[String(v??'').trim().toLowerCase().replace(/[\s_-]+/g,' '),i]));
  const required=['date','title','type','amount','category'];
  for(const name of required) if(!lookup.has(name)) throw new Error(`Missing required column: ${name}`);
  return {
    id: lookup.get('transaction id') ?? lookup.get('id'),
    date:lookup.get('date'), title:lookup.get('title'), type:lookup.get('type'),
    amount:lookup.get('amount'), category:lookup.get('category'),
  };
}
const idRegex = /^[a-f\d]{24}$/i;
export function parseImport(buffer, format) {
  if(!Buffer.isBuffer(buffer) || buffer.length===0 || buffer.length>MAX_FILE_BYTES) throw new Error('Choose a file smaller than 1 MB');
  if(!['csv','xlsx'].includes(format)) throw new Error('Choose a CSV or Excel (.xlsx) file');
  const rows=format==='csv' ? parseCsv(buffer) : parseXlsx(buffer);
  const columns=getColumns(rows.shift());
  if(rows.length===0) throw new Error('Add at least one transaction row');
  if(rows.length>MAX_IMPORT_ROWS) throw new Error(`Maximum ${MAX_IMPORT_ROWS} transactions per import`);
  const transactions=[], issues=[];
  for(let i=0;i<rows.length;i++) {
    const row=rows[i];
    const val=(col) => String(row[col] ?? '').trim();
    const type=val(columns.type).toLowerCase();
    const amountString=val(columns.amount).replace(/^[₹\s]+/,'').replaceAll(',','');
    const amount=Number(amountString);
    const category=CATEGORIES.get(val(columns.category).toLowerCase());
    let date=val(columns.date);
    // Excel saves date-formatted cells as Excel serial numbers.
    if(/^\d{5}(?:\.0+)?$/.test(date)) {
      const excelDay=Number(date);
      date=new Date(Date.UTC(1899,11,30)+excelDay*86400000).toISOString().slice(0,10);
    }
    const id=columns.id===undefined?'':val(columns.id);
    if(id && !idRegex.test(id)) { issues.push(`Row ${i+2}: invalid Transaction ID`); continue; }
    if(!['income','expense'].includes(type)) { issues.push(`Row ${i+2}: Type must be Income or Expense`); continue; }
    if(!amountString || !Number.isFinite(amount) || amount<=0) { issues.push(`Row ${i+2}: Amount must be positive`); continue; }
    const title=val(columns.title);
    // No active content in spreadsheets should be silently imported or exported.
    if (/^[\s\u0000-\u001f]*[=+@]/.test(title)) { issues.push(`Row ${i+2}: Title cannot start with a formula`); continue; }
    const checked=validateTransaction({
      title, amount:type==='income'?amount:-amount, category, transactionDate:date, type,
    });
    if(checked.error) { issues.push(`Row ${i+2}: ${checked.error}`); continue; }
    transactions.push({id, ...checked.value});
  }
  if(issues.length) {
    const err=new Error(`${issues.length} invalid row(s): ${issues.slice(0,5).join('; ')}${issues.length>5 ? '; ...' : ''}`);
    err.status=400;
    throw err;
  }
  return transactions;
}

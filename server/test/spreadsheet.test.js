import test from 'node:test';
import assert from 'node:assert/strict';
import {exportXlsx, exportCsv, parseImport, csvTemplate, MAX_IMPORT_ROWS} from '../src/utils/spreadsheet.js';

const example = [
  {_id:'0123456789abcdef01234567', title:'Salary', amount:7000, category:'Salary', transactionDate:'2026-11-10'},
  {_id:'0123456789abcdef01234568', title:'Food, dinner', amount:-250.75, category:'Food', transactionDate:'2026-11-09'},
];

test('CSV and Excel exports can be imported with signed amounts and transaction IDs',()=>{
  for(const [format,content] of [['csv',Buffer.from(exportCsv(example))],['xlsx',exportXlsx(example)]]) {
    const rows=parseImport(content,format);
    assert.equal(rows.length,2);
    assert.deepEqual(rows.map(r=>r.amount),[7000,-250.75]);
    assert.deepEqual(rows.map(r=>r.transactionDate),['2026-11-10','2026-11-09']);
    assert.equal(rows[0].id,example[0]._id);
    assert.equal(rows[1].title,'Food, dinner');
  }
});
test('downloadable template contains valid example data',()=>{
  const rows=parseImport(Buffer.from(csvTemplate()),'csv');
  assert.equal(rows.length,1);
  assert.equal(rows[0].type,'expense');
  assert.equal(rows[0].amount,-250);
});
test('CSV parser preserves escaped quotes and newlines',()=>{
  const csv='Date,Title,Type,Amount,Category\r\n2026-11-10,"Food, café \"\"lunch\"\"\nwith friend",Expense,20,Food\r\n';
  const rows=parseImport(Buffer.from(csv),'csv');
  assert.equal(rows[0].title,'Food, café "lunch"\nwith friend');
});
test('reject invalid imports atomically before writing',()=>{
  const header='Date,Title,Type,Amount,Category\n';
  for(const row of [
    '2026-11-10,Food,Expense,-500,Food',
    '2026-11-10,Food,Expense,0,Food',
    '2026-02-30,Food,Expense,500,Food',
    '2026-11-10,Food,Expense,10,Unknown',
    '2026-11-10,=HYPERLINK(1),Expense,10,Food',
    '2026-11-10,Food,Neither,10,Food',
  ]) assert.throws(()=>parseImport(Buffer.from(header+row),'csv'));
  assert.throws(()=>parseImport(Buffer.from('Date,Title\n2026-11-10,Food'),'csv'),/Missing required column/i);
  assert.throws(()=>parseImport(Buffer.from(''),'csv'));
  assert.throws(()=>parseImport(Buffer.from('not-a-zip'),'xlsx'));
});
test('file and row limits prevent oversized imports',()=>{
  assert.throws(()=>parseImport(Buffer.alloc(1024*1024+1),'csv'),/1 MB/);
  const rows='Date,Title,Type,Amount,Category\n'+Array.from({length:MAX_IMPORT_ROWS+1},()=> '2026-11-10,Foo,Income,1,Salary').join('\n');
  assert.throws(()=>parseImport(Buffer.from(rows),'csv'),/Maximum 200/);
});
test('Excel/CSV download escapes formula-like user titles',()=>{
  const row=[{...example[0],title:'=HYPERLINK("bad")'}];
  const csv=exportCsv(row);
  assert.ok(csv.includes("'=HYPERLINK"));
  const excel=parseImport(exportXlsx(row),'xlsx');
  assert.equal(excel[0].title,"'=HYPERLINK(\"bad\")");
});
test('Excel files with XML namespace prefixes and empty cells are supported', async () => {
  const { readFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const exampleFile = fileURLToPath(new URL('./sample-import.xlsx', import.meta.url));
  const rows = parseImport(readFileSync(exampleFile), 'xlsx');
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map(row => row.amount), [-650.25, 10000]);
  assert.deepEqual(rows.map(row => row.transactionDate), ['2026-11-10', '2026-11-09']);
});

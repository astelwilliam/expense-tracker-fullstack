import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import {
  MAX_EXPORT_ROWS, MAX_FILE_BYTES, parseImport, exportCsv, exportXlsx, csvTemplate,
} from "../utils/spreadsheet.js";

function extractUpload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || !['csv','xlsx'].includes(body.format) || typeof body.data !== 'string') {
    throw new Error('Provide a CSV or XLSX file');
  }
  if(body.data.length===0 || body.data.length > Math.ceil(MAX_FILE_BYTES*4/3)+8 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(body.data)) {
    throw new Error('File must be valid base64, maximum 1 MB');
  }
  const buffer=Buffer.from(body.data,'base64');
  if(buffer.length>MAX_FILE_BYTES || buffer.length===0) throw new Error('File must be between 1 byte and 1 MB');
  return parseImport(buffer,body.format);
}

async function dedupe(transactions,user) {
  const ids=[...new Set(transactions.map(t=>t.id).filter(Boolean))];
  if(!ids.length) return {pending:transactions,existing:0};
  const found=await Transaction.find({user, _id:{$in: ids.map(id=>new mongoose.Types.ObjectId(id))}}).select('_id').lean();
  const already=new Set(found.map(row=>String(row._id)));
  const pending=transactions.filter(row=>!row.id || !already.has(row.id));
  return {pending,existing:transactions.length-pending.length};
}

export function exportTemplate(_req,res) {
  res.set('Cache-Control','no-store');
  res.set('Content-Disposition','attachment; filename="expense-tracker-template.csv"');
  res.type('text/csv; charset=utf-8').send(csvTemplate());
}
export async function exportTransactions(req,res,next) {
  const format=req.query.format ?? 'xlsx';
  if(!['csv','xlsx'].includes(format)) return res.status(400).json({message:'Choose CSV or XLSX'});
  try {
    // Unlike the regular dashboard's 500-record limit, exports include all account records up to this limit.
    const rows=await Transaction.find({user:req.user.id}).sort({createdAt:-1}).limit(MAX_EXPORT_ROWS+1).lean();
    if(rows.length>MAX_EXPORT_ROWS) return res.status(413).json({message:`Export limit is ${MAX_EXPORT_ROWS} transactions`});
    const data=format==='csv'?exportCsv(rows):exportXlsx(rows);
    res.set('Cache-Control','no-store');
    res.set('Content-Disposition',`attachment; filename="expense-tracker-${new Date().toISOString().slice(0,10)}.${format}"`);
    res.type(format==='csv'?'text/csv; charset=utf-8':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(data);
  }catch(err){return next(err);}
}

async function inspect(req,res,next,commit) {
  let transactions;
  try { transactions=extractUpload(req.body); }
  catch(err) { return res.status(err.status||400).json({message:err.message}); }
  try {
    const {pending,existing}=await dedupe(transactions,req.user.id);
    if(!commit) return res.json({total:transactions.length,toImport:pending.length,alreadyImported:existing,
      preview:pending.slice(0,5).map(({id,...row})=>row)});
    if(pending.length===0) return res.json({imported:0,alreadyImported:existing});
    const inserted=await Transaction.insertMany(pending.map(({id:ignored, ...row})=>({...row,user:req.user.id})), {ordered:true});
    return res.status(201).json({imported:inserted.length,alreadyImported:existing});
  } catch(err) {return next(err);}
}
export const previewImport=(req,res,next)=>inspect(req,res,next,false);
export const commitImport=(req,res,next)=>inspect(req,res,next,true);

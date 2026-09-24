import React, { useState } from 'react';
import { ActionDialog } from './ActionDialog';
import { buttonClass, primaryButtonClass } from './records';
import { useRuntime } from '../runtime/RuntimeProvider';
import type { PrinterJobResult } from '../types/runtime';

export function NativeReceiptDialog({ order, payment, businessName, outletName, cashierName, onClose, onJobsChanged }: {
  order: any;
  payment: { tenderType: string; amount: number; receiptRef?: string; cashTendered?: number; changeDue?: number };
  businessName: string;
  outletName: string;
  cashierName: string;
  onClose: () => void;
  onJobsChanged: () => void;
}) {
  const runtime=useRuntime();
  const [message,setMessage]=useState('');
  const [job,setJob]=useState<PrinterJobResult|null>(null);
  const [busy,setBusy]=useState(false);
  const money=(value:number)=>`KES ${Number(value||0).toLocaleString('en-KE',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const date=new Date(order.completedAt||order.createdAt).toLocaleString('en-KE',{timeZone:'Africa/Nairobi'});
  const copy=(label:string,internal:boolean)=>[
    businessName,outletName,label,`Receipt: ${order.orderNumber}`,`Date: ${date}`,
    ...(internal?[`Transaction ID: ${order.id}`,`Cashier: ${cashierName}`]:[]),
    ...(order.items||[]).map((item:any)=>`${item.quantity} x ${item.productName}: ${money(item.lineTotal??item.totalPrice)}`),
    `Order total: ${money(order.grandTotal)}`,`This payment: ${money(payment.amount)}`,
    `Tender: ${payment.tenderType}`,payment.receiptRef?`Reference: ${payment.receiptRef}`:'',
    payment.cashTendered?`Cash tendered: ${money(payment.cashTendered)}`:'',payment.changeDue?`Change: ${money(payment.changeDue)}`:'',
    `Balance remaining: ${money(Math.max(0,Number(order.grandTotal)-Number(order.amountPaid)))}`,
    ...(payment.tenderType==='MPESA'?['M-Pesa was manually confirmed; account reconciliation is separate.']:[]),
    'This document is not evidence of eTIMS submission.'
  ].filter(Boolean);
  const customer=copy('CUSTOMER COPY',false);
  const business=copy('BUSINESS RECORD COPY - RETAIN FOR RECONCILIATION',true);
  const printBoth=async()=>{
    setBusy(true);setMessage('');
    try{
      const result=await runtime.printReceipt({orderId:order.id,customerLines:customer,businessLines:business});
      setJob(result);
      if(result.state==='OS_DIALOG'){
        window.print();
        setMessage('Print dialog opened. Choose the installed XP-80T queue; both copies are included.');
      }else if(result.state==='MANUAL'){
        await navigator.clipboard.writeText(`${customer.join('\n')}\n\n${business.join('\n')}`);
        setMessage('Both copies copied to the clipboard for manual printing.');
      }else{
        setMessage(`${result.state}: ${result.message||'Printer job updated.'}`);
        onJobsChanged();
      }
    }catch(error){setMessage(String(error))}
    finally{setBusy(false)}
  };
  const retry=async(confirmDuplicate:boolean)=>{
    if(!job?.jobId)return;
    setBusy(true);setMessage('');
    try{const result=await runtime.retryPrinterJob(job.jobId,confirmDuplicate);setJob(result);setMessage(`${result.state}: ${result.message||'Printer job updated.'}`);onJobsChanged()}
    catch(error){setMessage(String(error))}
    finally{setBusy(false)}
  };
  return <ActionDialog title="Print receipts" onClose={onClose}>
    <div className="space-y-3">
      <p className="text-sm text-slate-400">This job contains separate customer and business copies. ServOS uses the configured XP-80T connection or opens the system print dialog.</p>
      <div className="rounded-lg border border-slate-700 bg-white p-3 font-mono text-xs text-black"><b>{customer[2]}</b><br/>{customer.slice(0,6).join(' | ')}</div>
      <div className="rounded-lg border border-slate-700 bg-white p-3 font-mono text-xs text-black"><b>{business[2]}</b><br/>Includes transaction ID and cashier for retained records.</div>
      <div className="flex flex-wrap gap-2"><button disabled={busy} className={primaryButtonClass} onClick={()=>void printBoth()}>{busy?'Sending…':'Print both copies'}</button><button className={buttonClass} onClick={()=>void navigator.clipboard.writeText(`${customer.join('\n')}\n\n${business.join('\n')}`).then(()=>setMessage('Both copies copied to clipboard.')).catch(()=>setMessage('Clipboard is unavailable.'))}>Copy both</button><button className={buttonClass} onClick={onClose}>Done</button></div>
      {job?.state==='QUEUED'&&job.jobId&&<button disabled={busy} className={buttonClass} onClick={()=>void retry(false)}>Retry queued print</button>}
      {job?.state==='DELIVERY_UNCERTAIN'&&job.jobId&&<div className="rounded-lg border border-amber-700/50 bg-amber-950/30 p-3 text-sm"><p>The printer may have received part or all of this receipt. Check the paper before retrying to avoid duplicates.</p><button disabled={busy} className={buttonClass+' mt-2'} onClick={()=>void retry(true)}>Reprint anyway (may duplicate)</button></div>}
      {message&&<p role="status" className="text-xs text-slate-300">{message}</p>}
    </div>
    <style>{`@media screen{.receipt-print-source{position:absolute;left:-10000px;top:0}}@media print{@page{size:80mm auto;margin:3mm}body *{visibility:hidden!important}.receipt-print-source{position:static!important;display:block!important}.native-receipt-copy,.native-receipt-copy *{visibility:visible!important}.native-receipt-copy{display:block!important;width:74mm;padding:2mm 0;color:#000;background:#fff;font:9pt monospace;break-after:page;page-break-after:always}.native-receipt-copy:last-child{break-after:auto;page-break-after:auto}}`}</style>
    <div className="receipt-print-source"><article className="native-receipt-copy">{customer.map((line,i)=><p key={i}>{line}</p>)}</article><article className="native-receipt-copy">{business.map((line,i)=><p key={i}>{line}</p>)}</article></div>
  </ActionDialog>;
}

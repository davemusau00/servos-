import React, { useState } from 'react';
import { ActionDialog } from './ActionDialog';
import { buttonClass, primaryButtonClass } from './records';

export function NativeReceiptDialog({ order, payment, businessName, outletName, cashierName, onClose }: {
  order: any;
  payment: { tenderType: string; amount: number; receiptRef?: string; cashTendered?: number; changeDue?: number };
  businessName: string;
  outletName: string;
  cashierName: string;
  onClose: () => void;
}) {
  const [message,setMessage]=useState('');
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
  return <ActionDialog title="Print receipts" onClose={onClose}>
    <div className="space-y-3">
      <p className="text-sm text-slate-400">This print job contains the customer receipt and the business record copy. Select the installed Xprinter XP-80T queue in the Windows print dialog.</p>
      <div className="rounded-lg border border-slate-700 bg-white p-3 font-mono text-xs text-black"><b>{customer[2]}</b><br/>{customer.slice(0,6).join(' | ')}</div>
      <div className="rounded-lg border border-slate-700 bg-white p-3 font-mono text-xs text-black"><b>{business[2]}</b><br/>Includes transaction ID and cashier for retained records.</div>
      <div className="flex flex-wrap gap-2"><button className={primaryButtonClass} onClick={()=>{window.print();setMessage('Print dialog opened. Choose the XP-80T USB printer queue. Both copies are included in this job.')}}>Print both copies</button><button className={buttonClass} onClick={()=>void navigator.clipboard.writeText(`${customer.join('\n')}\n\n${business.join('\n')}`).then(()=>setMessage('Both copies copied to clipboard.')).catch(()=>setMessage('Clipboard is unavailable.'))}>Copy both</button><button className={buttonClass} onClick={onClose}>Done</button></div>
      {message&&<p role="status" className="text-xs text-slate-300">{message}</p>}
    </div>
    <style>{`@media screen{.receipt-print-source{position:absolute;left:-10000px;top:0}}@media print{@page{size:80mm auto;margin:3mm}body *{visibility:hidden!important}.receipt-print-source{position:static!important;display:block!important}.native-receipt-copy,.native-receipt-copy *{visibility:visible!important}.native-receipt-copy{display:block!important;width:74mm;padding:2mm 0;color:#000;background:#fff;font:9pt monospace;break-after:page;page-break-after:always}.native-receipt-copy:last-child{break-after:auto;page-break-after:auto}}`}</style>
    <div className="receipt-print-source"><article className="native-receipt-copy">{customer.map((line,i)=><p key={i}>{line}</p>)}</article><article className="native-receipt-copy">{business.map((line,i)=><p key={i}>{line}</p>)}</article></div>
  </ActionDialog>;
}

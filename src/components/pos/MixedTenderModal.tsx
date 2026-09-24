import React, { useState } from 'react';
import { useServOS } from '../../context/ServOSContext';
import { 
  DollarSign, 
  CreditCard, 
  Smartphone, 
  Bed, 
  CheckCircle2, 
  X, 
  Plus, 
  Trash2,
  Receipt,
  Sparkles
} from 'lucide-react';

import { Order } from '../../types/servos';

interface MixedTenderModalProps {
  isOpen: boolean;
  order?: Order | null;
  totalAmount?: number;
  onClose: () => void;
  onCompleteSettlement?: (splitPayments: { method: string; amount: number }[]) => void;
}

export const MixedTenderModal: React.FC<MixedTenderModalProps> = ({
  isOpen,
  order,
  totalAmount: rawTotalAmount,
  onClose,
  onCompleteSettlement
}) => {
  const { showToast } = useServOS();

  const totalAmount = order ? order.grandTotal : (rawTotalAmount || 0);

  // Split lines
  const [mpesaAmount, setMpesaAmount] = useState<number>(Math.floor(totalAmount / 2));
  const [cashAmount, setCashAmount] = useState<number>(Math.floor(totalAmount / 3));
  const [cardAmount, setCardAmount] = useState<number>(totalAmount - Math.floor(totalAmount / 2) - Math.floor(totalAmount / 3));
  const [roomAmount, setRoomAmount] = useState<number>(0);

  if (!isOpen) return null;

  const totalAllocated = Number(mpesaAmount || 0) + Number(cashAmount || 0) + Number(cardAmount || 0) + Number(roomAmount || 0);
  const remaining = totalAmount - totalAllocated;

  const handleSettle = () => {
    if (remaining !== 0) {
      showToast(`Please allocate exactly KES ${totalAmount.toLocaleString()} (Remaining: KES ${remaining.toLocaleString()})`, 'error');
      return;
    }

    const splits: { method: string; amount: number }[] = [];
    if (mpesaAmount > 0) splits.push({ method: 'MPESA', amount: mpesaAmount });
    if (cashAmount > 0) splits.push({ method: 'CASH', amount: cashAmount });
    if (cardAmount > 0) splits.push({ method: 'CARD', amount: cardAmount });
    if (roomAmount > 0) splits.push({ method: 'ROOM_CHARGE', amount: roomAmount });

    showToast(`Multi-method settlement authorized for KES ${totalAmount.toLocaleString()}!`, 'success');
    if (onCompleteSettlement) {
      onCompleteSettlement(splits);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-750 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">Split Tender Builder</span>
            <h3 className="text-base font-bold text-white">Multi-Method Settlement</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bill Total Banner */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between font-mono">
          <span className="text-xs text-slate-400">Total Bill Payable:</span>
          <span className="text-xl font-black text-amber-400">KES {totalAmount.toLocaleString()}</span>
        </div>

        {/* Tender Inputs */}
        <div className="space-y-3 font-mono text-xs">
          {/* M-PESA */}
          <div className="p-3 bg-slate-850 border border-slate-750 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-emerald-400 font-bold">
              <span className="flex items-center gap-1.5"><Smartphone className="w-4 h-4" /> M-PESA STK Push</span>
              <button 
                onClick={() => setMpesaAmount(totalAmount - cashAmount - cardAmount - roomAmount)}
                className="text-[10px] text-slate-400 hover:text-emerald-300 underline"
              >
                Fill Remaining
              </button>
            </div>
            <input
              type="number"
              value={mpesaAmount}
              onChange={e => setMpesaAmount(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 font-bold focus:outline-none focus:border-emerald-400"
            />
          </div>

          {/* Cash */}
          <div className="p-3 bg-slate-850 border border-slate-750 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-amber-400 font-bold">
              <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4" /> Cash Tendered</span>
              <button 
                onClick={() => setCashAmount(totalAmount - mpesaAmount - cardAmount - roomAmount)}
                className="text-[10px] text-slate-400 hover:text-amber-300 underline"
              >
                Fill Remaining
              </button>
            </div>
            <input
              type="number"
              value={cashAmount}
              onChange={e => setCashAmount(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 font-bold focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Card */}
          <div className="p-3 bg-slate-850 border border-slate-750 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-cyan-400 font-bold">
              <span className="flex items-center gap-1.5"><CreditCard className="w-4 h-4" /> EMV Card / Visa</span>
              <button 
                onClick={() => setCardAmount(totalAmount - mpesaAmount - cashAmount - roomAmount)}
                className="text-[10px] text-slate-400 hover:text-cyan-300 underline"
              >
                Fill Remaining
              </button>
            </div>
            <input
              type="number"
              value={cardAmount}
              onChange={e => setCardAmount(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 font-bold focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Balance Status */}
        <div className={`p-3 rounded-xl border flex items-center justify-between font-mono text-xs ${
          remaining === 0 
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
            : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
        }`}>
          <span>Remaining Balance:</span>
          <span className="font-black text-sm">
            {remaining === 0 ? '✓ Balanced (0)' : `KES ${remaining.toLocaleString()}`}
          </span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-3.5 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSettle}
            disabled={remaining !== 0}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold font-mono transition-all ${
              remaining === 0
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Authorize Split Payment
          </button>
        </div>
      </div>
    </div>
  );
};

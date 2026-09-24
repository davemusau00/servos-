import React, { useState } from 'react';
import { useServOS } from '../../context/ServOSContext';
import { 
  Printer, 
  Cpu, 
  Scale, 
  Coins, 
  ScanLine, 
  CheckCircle2, 
  Wifi, 
  Play, 
  X,
  FileText,
  CreditCard,
  Receipt,
  AlertTriangle,
  RefreshCw,
  Power,
  ShieldCheck,
  Radio,
  SlidersHorizontal,
  Flame
} from 'lucide-react';
import { EdgeDeviceStatus } from '../../types/servos';

interface EdgeHardwareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EdgeHardwareModal: React.FC<EdgeHardwareModalProps> = ({ isOpen, onClose }) => {
  const { 
    edgeDevices, 
    updateEdgeDeviceStatus, 
    reconnectAllEdgeDevices, 
    triggerEdgePrint, 
    triggerCashDrawerKick 
  } = useServOS();

  const [testOutput, setTestOutput] = useState<string>('');
  const [scaleReading, setScaleReading] = useState<number>(3.840);
  const [isDrawerKicking, setIsDrawerKicking] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'DEVICES' | 'DIAGNOSTICS'>('DEVICES');

  if (!isOpen) return null;

  const handleTestPrint = (deviceName: string) => {
    triggerEdgePrint('RECEIPT', { testDevice: deviceName });
    setTestOutput(
`[ESC/POS THERMAL PRINT EMULATOR - ${deviceName}]
------------------------------------------------
         SERVOS HOSPITALITY SUITE
       VIP Bar Lounge & Dining Room
KRA PIN: P051982736Z  |  CU: KRA-OSCU-NBO-00914
------------------------------------------------
1x Jameson Black Barrel (Double 60ml)    850.00
1x Schweppes Tonic Water 300ml           250.00
------------------------------------------------
Subtotal:                               1,100.00
16% VAT:                                  176.00
2% Catering Levy:                          22.00
TOTAL:                               KES 1,100.00
------------------------------------------------
M-PESA: manual receipt confirmation required
QR CODE EMBEDDED: https://itax.kra.go.ke/...
------------------------------------------------
      THANK YOU FOR VISITING SERVOS!`
    );
  };

  const handleTestFiscalPrint = (deviceName: string) => {
    triggerEdgePrint('RECEIPT', { testDevice: deviceName, fiscal: true });
    setTestOutput(
`[KRA OSCU/VSCU FISCALIZER HARDWARE EMULATOR - ${deviceName}]
================================================
KENYA REVENUE AUTHORITY - FISCAL TAX INVOICE
CU Serial Number: KRA-OSCU-NBO-00914
Trader PIN: P051284920M | Tax Expiry: 2026-12-31
------------------------------------------------
Fiscal Receipt Number: KRA-INV-2026-0923-8891
Control Code: 4E9A-88B1-0C42-99EA
Internal Hash: SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
eTIMS Online Validation Status: [ACKNOWLEDGED & SIGNED]
================================================
>>> Fiscal hardware self-check completed in 18ms.`
    );
  };

  const handleTestCardReader = (deviceName: string) => {
    setTestOutput(
`[EMV CARD READER TERMINAL COMMUNICATOR - ${deviceName}]
================================================
Protocol: ISO/IEC 7816 & EMV Level 1 / Level 2
Target IP: 192.168.1.185:8080 (LAN Direct Socket)
------------------------------------------------
Sending EMV Ping: ENQ (0x05)
Response Received: ACK (0x06) in 12ms
Card Reader Model: Ingenico Desk 3500 Contactless/Chip
Firmware: v12.4.9 | Keys: Master/Session (DUKPT Live)
Reader Status: READY FOR CONTACTLESS / INSERTION
================================================`
    );
  };

  const handleKickDrawer = () => {
    setIsDrawerKicking(true);
    triggerCashDrawerKick();
    setTestOutput('>>> ESC/POS Command Sent: 0x1B 0x70 0x00 0x19 0xFA (Drawer Solenoid 24V Kick Pulse Verified)');
    setTimeout(() => setIsDrawerKicking(false), 800);
  };

  const handleSampleScale = () => {
    const weights = [3.840, 4.210, 5.000, 2.760, 0.450];
    const nextWeight = weights[Math.floor(Math.random() * weights.length)];
    setScaleReading(nextWeight);
    setTestOutput(`>>> Scale tare reading captured via RS-232 COM3: ${nextWeight.toFixed(3)} kg`);
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'FISCAL_PRINTER':
        return Receipt;
      case 'CARD_READER':
        return CreditCard;
      case 'KITCHEN_PRINTER':
        return Flame;
      case 'CASH_DRAWER':
        return Coins;
      case 'WEIGHING_SCALE':
        return Scale;
      case 'RECEIPT_PRINTER':
      default:
        return Printer;
    }
  };

  const getStatusBadge = (status: EdgeDeviceStatus) => {
    switch (status) {
      case 'ONLINE':
        return {
          label: 'ONLINE',
          bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
          dot: 'bg-emerald-400'
        };
      case 'OFFLINE':
        return {
          label: 'OFFLINE',
          bg: 'bg-slate-800 border-slate-700 text-slate-400',
          dot: 'bg-slate-500'
        };
      case 'ERROR':
        return {
          label: 'FAULT / ERROR',
          bg: 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse',
          dot: 'bg-rose-500 animate-ping'
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl p-4 sm:p-6 max-w-3xl w-full shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">Edge LAN Hardware Controller</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  Active Agent
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Real-time Fiscal Units, EMV Card Readers, ESC/POS Printers & Peripherals
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Toolbar */}
        <div className="py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('DEVICES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'DEVICES'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              Connected Devices ({edgeDevices.length})
            </button>
            <button
              onClick={() => setActiveTab('DIAGNOSTICS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'DIAGNOSTICS'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              Raw Agent Terminal Log
            </button>
          </div>

          <button
            onClick={reconnectAllEdgeDevices}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Re-Scan All Peripherals</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1">
          {activeTab === 'DEVICES' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {edgeDevices.map(dev => {
                const Icon = getDeviceIcon(dev.type);
                const statusMeta = getStatusBadge(dev.status);

                return (
                  <div
                    key={dev.id}
                    className={`p-3.5 bg-slate-950 rounded-xl border transition-all flex flex-col justify-between ${
                      dev.status === 'ERROR'
                        ? 'border-rose-500/50 bg-rose-950/10'
                        : dev.status === 'OFFLINE'
                        ? 'border-slate-800 opacity-80'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Top Header of Device Card */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-lg ${
                            dev.status === 'ERROR'
                              ? 'bg-rose-500/20 text-rose-300'
                              : dev.status === 'ONLINE'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-200 line-clamp-1">{dev.name}</div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                              {dev.type} • {dev.connection}{dev.ipAddress ? ` (${dev.ipAddress})` : ''}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 shrink-0 ${statusMeta.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                          {statusMeta.label}
                        </span>
                      </div>

                      {/* Error Message if in Error state */}
                      {dev.status === 'ERROR' && (
                        <div className="mt-2 p-2 bg-rose-500/15 border border-rose-500/30 rounded-lg text-[11px] font-mono text-rose-300 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                          <span className="truncate">{dev.errorMessage || 'Hardware fault / Out of paper'}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions & Simulation Controls */}
                    <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      {/* Test triggers */}
                      <div className="flex items-center gap-1.5">
                        {dev.type === 'FISCAL_PRINTER' ? (
                          <button
                            onClick={() => handleTestFiscalPrint(dev.name)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded border border-slate-700 flex items-center gap-1 transition-colors"
                          >
                            <Receipt className="w-3 h-3 text-amber-400" />
                            <span>Fiscal Ping</span>
                          </button>
                        ) : dev.type === 'CARD_READER' ? (
                          <button
                            onClick={() => handleTestCardReader(dev.name)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded border border-slate-700 flex items-center gap-1 transition-colors"
                          >
                            <CreditCard className="w-3 h-3 text-amber-400" />
                            <span>Test EMV</span>
                          </button>
                        ) : dev.type === 'RECEIPT_PRINTER' || dev.type === 'KITCHEN_PRINTER' ? (
                          <button
                            onClick={() => handleTestPrint(dev.name)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded border border-slate-700 flex items-center gap-1 transition-colors"
                          >
                            <Printer className="w-3 h-3 text-amber-400" />
                            <span>Test Print</span>
                          </button>
                        ) : dev.type === 'CASH_DRAWER' ? (
                          <button
                            onClick={handleKickDrawer}
                            className={`px-2.5 py-1 text-slate-200 text-[11px] font-semibold rounded border transition-colors flex items-center gap-1 ${
                              isDrawerKicking ? 'bg-amber-500 text-slate-950 border-amber-400 animate-bounce' : 'bg-slate-800 hover:bg-slate-700 border-slate-700'
                            }`}
                          >
                            <Coins className="w-3 h-3 text-amber-400" />
                            <span>Kick Solenoid</span>
                          </button>
                        ) : dev.type === 'WEIGHING_SCALE' ? (
                          <button
                            onClick={handleSampleScale}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded border border-slate-700 flex items-center gap-1 transition-colors"
                          >
                            <Scale className="w-3 h-3 text-amber-400" />
                            <span>Tare Read</span>
                          </button>
                        ) : null}
                      </div>

                      {/* State Simulator Switcher for Demo / Testing */}
                      <div className="flex items-center gap-1 font-mono text-[10px]">
                        <span className="text-slate-500 mr-1">Simulate:</span>
                        <button
                          onClick={() => updateEdgeDeviceStatus(dev.id, 'ONLINE')}
                          title="Simulate Online"
                          className={`px-1.5 py-0.5 rounded font-bold ${
                            dev.status === 'ONLINE' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          ON
                        </button>
                        <button
                          onClick={() => updateEdgeDeviceStatus(dev.id, 'OFFLINE')}
                          title="Simulate Offline"
                          className={`px-1.5 py-0.5 rounded font-bold ${
                            dev.status === 'OFFLINE' ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          OFF
                        </button>
                        <button
                          onClick={() => updateEdgeDeviceStatus(dev.id, 'ERROR', 'Out of paper / Cutter jam')}
                          title="Simulate Error"
                          className={`px-1.5 py-0.5 rounded font-bold ${
                            dev.status === 'ERROR' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-rose-300'
                          }`}
                        >
                          ERR
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Scale Weight Banner */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between font-mono">
                <span className="text-xs text-slate-400">Tare Scale COM3 Stream:</span>
                <div className="text-base font-bold text-amber-300">
                  {scaleReading.toFixed(3)} KG <span className="text-xs text-slate-500">(Net Fluid Tare)</span>
                </div>
              </div>

              {/* Raw Terminal Output Preview */}
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                  Raw Edge Peripheral Controller Log:
                </span>
                <pre className="mt-1.5 p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {testOutput || '>>> Edge hardware agent listening on LAN port 9876. Ready for commands...'}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>LAN Agent v3.1.2 · Fiscal KRA OSCU Daemon Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold transition-colors w-full sm:w-auto"
          >
            Close Controller
          </button>
        </div>
      </div>
    </div>
  );
};

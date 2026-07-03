import { useEffect, useState } from 'react';
import { Check, Copy, Download, Loader2, Printer, QrCode } from 'lucide-react';
import API_BASE_URL from '../config/api';

export default function EquipmentQRCode({ equipment }) {
  const [qr, setQr] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadQr() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/equipment/${equipment.id}/qr`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'QR code unavailable');
        if (active) setQr(data);
      } catch (requestError) {
        if (active) setError(requestError.message);
      }
    }
    loadQr();
    return () => { active = false; };
  }, [equipment.id]);

  const downloadQr = () => {
    if (!qr) return;
    const anchor = document.createElement('a');
    anchor.href = qr.dataUrl;
    anchor.download = `uniguide-${equipment.assetTag}-qr.png`;
    anchor.click();
  };

  const copyLink = async () => {
    if (!qr) return;
    await navigator.clipboard.writeText(qr.targetUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const printQr = () => {
    if (!qr) return;
    const printWindow = window.open('', '_blank', 'width=640,height=760');
    if (!printWindow) return;
    printWindow.document.write(`<!doctype html><html><head><title>${equipment.assetTag} QR</title><style>body{font-family:Arial;text-align:center;padding:32px;color:#08162d}img{width:420px;max-width:90%}h1{margin-bottom:4px}p{margin:6px}</style></head><body><h1>UniGuide Rwanda</h1><p><strong>${equipment.name}</strong></p><p>${equipment.assetTag}</p><img src="${qr.dataUrl}" alt="QR code for ${equipment.name}"><p>Scan to view equipment guidance and borrowing information.</p></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 300);
  };

  return (
    <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm" aria-labelledby="equipment-qr-heading">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-blue-50 text-[#1f5ff0]"><QrCode size={20} /></span>
        <div>
          <h3 id="equipment-qr-heading" className="text-sm font-bold text-slate-900">Equipment QR Code</h3>
          <p className="text-xs text-slate-500">Printable, high-correction QR linked to this equipment record.</p>
        </div>
      </div>
      {!qr && !error && <div className="mt-5 flex items-center justify-center py-10 text-sm font-semibold text-slate-500"><Loader2 className="mr-2 animate-spin" size={18} /> Generating QR code…</div>}
      {error && <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}
      {qr && <>
        <div className="mt-4 grid place-items-center rounded-lg border border-slate-200 bg-white p-4">
          <img src={qr.dataUrl} alt={`QR code for ${equipment.name}, asset ${equipment.assetTag}`} className="h-52 w-52" />
          <p className="mt-2 break-all text-center text-[10px] text-slate-400">{qr.targetUrl}</p>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button onClick={downloadQr} type="button" className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 px-2 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Download size={14} /> Download</button>
          <button onClick={printQr} type="button" className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 px-2 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Printer size={14} /> Print</button>
          <button onClick={copyLink} type="button" className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 px-2 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}</button>
        </div>
      </>}
    </section>
  );
}

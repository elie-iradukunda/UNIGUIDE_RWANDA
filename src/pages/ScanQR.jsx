import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Camera, ChevronRight, Loader2, Package, QrCode, Search, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import { equipmentItems } from '../data/demoData';
import { handleImageError } from '../utils/imageFallback';

const ScanQR = () => {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(equipmentItems);
  const [loading, setLoading] = useState(true);
  const [scanningId, setScanningId] = useState(null);
  const [search, setSearch] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraMessage, setCameraMessage] = useState('');
  const [qrValue, setQrValue] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const fetchEquipment = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/equipment?limit=50`);
        if (!res.ok) throw new Error('Using demo equipment');
        const data = await res.json();
        if (mounted) setEquipment(data.equipment?.length ? data.equipment : equipmentItems);
      } catch {
        if (mounted) setEquipment(equipmentItems);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchEquipment();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => () => {
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const filteredEquipment = useMemo(() => {
    const term = search.toLowerCase();
    return equipment.filter((item) => (
      item.name?.toLowerCase().includes(term) ||
      item.assetTag?.toLowerCase().includes(term) ||
      item.department?.toLowerCase().includes(term)
    ));
  }, [equipment, search]);

  const stopCamera = () => {
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  const openQrValue = (value) => {
    const normalized = String(value || '').trim();
    let identifier = normalized;
    try {
      const url = new URL(normalized, window.location.origin);
      const match = url.pathname.match(/\/equipment\/([^/]+)/);
      if (match) identifier = decodeURIComponent(match[1]);
    } catch {
      // Asset tags and internal identifiers are valid manual input.
    }
    const item = equipment.find((record) => record.id === identifier || record.assetTag?.toLowerCase() === identifier.toLowerCase());
    if (!item) {
      setCameraMessage('No UniGuide equipment matched that QR value or asset tag.');
      return false;
    }
    stopCamera();
    setScanningId(item.id);
    window.setTimeout(() => navigate(`/equipment/${item.id}`), 350);
    return true;
  };

  const startCamera = async () => {
    setCameraMessage('');
    if (!navigator.mediaDevices?.getUserMedia || !window.BarcodeDetector) {
      setCameraMessage('Live QR detection is not supported by this browser. Use a phone camera, paste the QR link, or select the asset below.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraActive(true);
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      const detectFrame = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes[0]?.rawValue && openQrValue(codes[0].rawValue)) return;
        } catch {
          // A frame can be unreadable while the camera is moving; continue scanning.
        }
        frameRef.current = window.requestAnimationFrame(detectFrame);
      };
      frameRef.current = window.requestAnimationFrame(detectFrame);
    } catch {
      setCameraMessage('Camera access was not granted. You can still paste a QR link or choose an asset below.');
      stopCamera();
    }
  };

  const handleScan = (item) => {
    setScanningId(item.id);
    window.setTimeout(() => navigate(`/equipment/${item.id}`), 650);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-[#1f5ff0]">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Scan QR Code</h1>
          <p className="text-xs font-medium text-slate-500">Scan equipment QR code or select from the list below</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-900 bg-[#071120] shadow-sm">
        <div className="grid min-h-[290px] place-items-center p-8">
          {scanningId ? (
            <div className="text-center text-white">
              <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              <p className="text-sm font-semibold">Processing QR code...</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="relative mx-auto mb-5 grid h-44 w-44 place-items-center rounded-lg border border-white/20">
                <Corner className="-left-1 -top-1 border-l-4 border-t-4" />
                <Corner className="-right-1 -top-1 border-r-4 border-t-4" />
                <Corner className="-bottom-1 -left-1 border-b-4 border-l-4" />
                <Corner className="-bottom-1 -right-1 border-b-4 border-r-4" />
                <QrCode size={56} className="text-white/35" strokeWidth={1.5} />
                <video ref={videoRef} muted playsInline aria-label="Live camera view for QR scanning" className={`absolute inset-0 h-full w-full rounded-lg object-cover ${cameraActive ? 'block' : 'hidden'}`} />
              </div>
              <p className="mx-auto max-w-sm text-sm leading-6 text-white/65">
                Point your camera at the QR code on the equipment to open manuals, videos, details, and borrowing options.
              </p>
              <button type="button" onClick={cameraActive ? stopCamera : startCamera} className="mt-4 inline-flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-xs font-bold text-slate-900">
                {cameraActive ? <Square size={14} /> : <Camera size={15} />}
                {cameraActive ? 'Stop Camera' : 'Start Camera Scanner'}
              </button>
            </div>
          )}
        </div>
      </section>

      <form
        onSubmit={(event) => { event.preventDefault(); openQrValue(qrValue); }}
        className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm"
      >
        <label htmlFor="qr-value" className="text-xs font-bold text-slate-700">QR link or asset tag</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input id="qr-value" value={qrValue} onChange={(event) => setQrValue(event.target.value)} placeholder="Paste the scanned link or enter OSC-001" className="min-w-0 flex-1 rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#1f5ff0] focus:ring-2 focus:ring-blue-100" />
          <button className="rounded-md bg-[#1f5ff0] px-4 py-2.5 text-xs font-bold text-white">Open Equipment</button>
        </div>
        {cameraMessage && <p role="status" className="mt-2 text-xs font-semibold text-amber-700">{cameraMessage}</p>}
      </form>

      <section className="rounded-lg border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Available Equipment</h2>
            <p className="mt-1 text-xs text-slate-500">Use this verified list when a camera is unavailable during testing.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search equipment..."
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#1f5ff0] focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-[#1f5ff0]" size={28} />
          </div>
        ) : (
          <div className="divide-y divide-slate-100 p-2">
            {filteredEquipment.map((item) => (
              <button
                key={item.id}
                onClick={() => handleScan(item)}
                className="flex w-full items-center gap-3 rounded-md p-3 text-left transition hover:bg-blue-50/40"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                  {item.image ? <img src={item.image} alt="" onError={handleImageError} className="h-full w-full object-cover" /> : <Package size={22} className="text-slate-400" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-bold text-slate-900">{item.name}</span>
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">{item.assetTag}</span>
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
                    <span>{item.department}</span>
                    <span>{item.location}</span>
                    <span className={item.status === 'Available' ? 'text-emerald-600' : 'text-amber-600'}>{item.status}</span>
                  </span>
                </span>
                <ChevronRight size={18} className="text-slate-400" />
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const Corner = ({ className }) => (
  <span className={`absolute h-8 w-8 rounded-sm border-blue-500 ${className}`} />
);

export default ScanQR;

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CalendarDays,
  FileText,
  Image as ImageIcon,
  Info,
  Loader2,
  MapPinned,
  Play,
  Video,
} from 'lucide-react';
import API_BASE_URL from '../config/api';
import { announcements, findEquipmentById } from '../data/demoData';
import EquipmentQRCode from '../components/EquipmentQRCode';
import { handleImageError } from '../utils/imageFallback';

const EquipmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [borrowForm, setBorrowForm] = useState({ purpose: '', startDate: '2026-06-29', endDate: '2026-07-01' });
  const [borrowSuccess, setBorrowSuccess] = useState(false);
  const [borrowError, setBorrowError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);
  const userRole = localStorage.getItem('userRole') || '';
  const canBorrow = userRole === 'Student';

  useEffect(() => {
    let mounted = true;

    const loadEquipment = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/equipment/${id}`);
        if (!res.ok) throw new Error('Using demo equipment');
        const data = await res.json();
        if (mounted) setEquipment(data);
      } catch {
        if (mounted) setEquipment(findEquipmentById(id) || findEquipmentById('osc-001'));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadEquipment();
    return () => {
      mounted = false;
    };
  }, [id]);

  const resources = useMemo(() => {
    if (!equipment) return [];
    const videos = parseList(equipment.videoUrls);
    const gallery = parseList(equipment.galleryImages);

    return [
      equipment.manualUrl && { type: 'pdf', title: 'User Manual', desc: 'PDF, 2.4 MB', action: () => openResource(equipment.manualUrl) },
      { type: 'guide', title: 'Quick Start Guide', desc: 'PDF, 1.1 MB', action: () => openResource(equipment.manualUrl || '#') },
      ...videos.map((video, index) => ({ type: 'video', title: video.title || `Tutorial Video ${index + 1}`, desc: 'YouTube Link', action: () => setActiveVideo(video) })),
      gallery.length > 0 && { type: 'image', title: 'Images', desc: `${gallery.length} images`, action: () => openResource(gallery[0]) },
      { type: 'spec', title: 'Specifications', desc: 'View Details', action: () => document.getElementById('specifications')?.scrollIntoView({ behavior: 'smooth' }) },
      equipment.safetyManualUrl && { type: 'warning', title: 'Safety Instructions', desc: 'PDF, 0.8 MB', action: () => openResource(equipment.safetyManualUrl) },
    ].filter(Boolean);
  }, [equipment]);

  const handleBorrowSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setBorrowError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ equipmentId: equipment.id, ...borrowForm }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Borrow request failed.');
      setBorrowSuccess(true);
      window.setTimeout(() => setBorrowSuccess(false), 3500);
      setBorrowForm({ purpose: '', startDate: '2026-06-29', endDate: '2026-07-01' });
    } catch (requestError) {
      setBorrowError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#1f5ff0]" size={32} />
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="rounded-lg border border-slate-100 bg-white p-8 text-center shadow-sm">
        <PackageFallback />
        <h1 className="mt-4 text-lg font-bold text-slate-900">Equipment record unavailable</h1>
        <p className="mt-1 text-sm text-slate-500">Choose another item from the equipment inventory.</p>
        <Link to="/equipment" className="mt-5 inline-flex rounded-md bg-[#1f5ff0] px-4 py-2 text-sm font-bold text-white">
          View Equipment
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-[#1f5ff0]">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Equipment Detail</h1>
            <p className="text-xs font-medium text-slate-500">Scan Result</p>
          </div>
        </div>
        <Link to="/notifications" className="relative grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm">
          <Bell size={19} />
          <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border-2 border-[#f8fafc] bg-red-500 text-[10px] font-bold text-white">3</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-[210px_1fr]">
              <div className="h-36 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                {equipment.image ? <img src={equipment.image} alt={equipment.name} onError={handleImageError} className="h-full w-full object-cover" /> : <PackageFallback />}
              </div>
              <div className="min-w-0">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{equipment.name}</h2>
                  <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">{equipment.assetTag}</span>
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <Meta label="Department" value={equipment.department} />
                  <Meta label="Location" value={equipment.location} />
                  <Meta label="Status" value={equipment.status} valueClass={equipment.status === 'Available' ? 'text-emerald-600' : 'text-amber-600'} />
                  <Meta label="Available" value={`${equipment.available} / ${equipment.stock}`} />
                </div>
                <Link to="/lab-guide" className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-xs font-bold text-[#1f5ff0] hover:bg-blue-100">
                  <MapPinned size={15} /> Open accessible laboratory directions
                </Link>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5">
              <h3 className="text-sm font-bold text-slate-900">About Equipment</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{equipment.description}</p>
            </div>

            <div id="specifications" className="mt-5 border-t border-slate-100 pt-5">
              <h3 className="text-sm font-bold text-slate-900">Specifications</h3>
              <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3">
                <Spec label="Model" value={equipment.modelNumber} />
                <Spec label="Serial No." value={equipment.serialNumber} />
                <Spec label="Category" value={equipment.category} />
                <Spec label="Purchase Date" value={formatDate(equipment.purchaseDate)} />
                <Spec label="Warranty Until" value={formatDate(equipment.warrantyExpiry)} />
                <Spec label="Value" value={`$${Number(equipment.cost || 0).toFixed(2)}`} />
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-bold text-slate-900">Resources</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              {resources.map((resource) => (
                <button key={resource.title} onClick={resource.action} className="rounded-lg border border-slate-100 bg-white p-4 text-center shadow-sm transition hover:border-blue-100 hover:bg-blue-50/30">
                  <span className="mx-auto grid h-10 w-10 place-items-center rounded-md bg-slate-50">
                    <ResourceIcon type={resource.type} />
                  </span>
                  <span className="mt-3 block text-xs font-bold text-slate-900">{resource.title}</span>
                  <span className="mt-1 block text-[10px] font-medium text-slate-500">{resource.desc}</span>
                </button>
              ))}
            </div>
          </section>

          {activeVideo && (
            <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">{activeVideo.title}</h3>
                <button onClick={() => setActiveVideo(null)} className="text-xs font-bold text-[#1f5ff0]">Close</button>
              </div>
              <div className="grid aspect-video place-items-center rounded-lg bg-slate-950 text-white">
                <div className="text-center">
                  <Play className="mx-auto mb-3 text-red-500" size={44} />
                  <p className="text-sm font-semibold">Tutorial video selected</p>
                  <a href={activeVideo.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-bold text-blue-300 hover:underline">
                    Open in YouTube
                  </a>
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Borrow This Equipment</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">Submit a request to borrow this equipment for your practical work.</p>

            {borrowSuccess && (
              <div className="mt-4 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                Borrow request submitted successfully.
              </div>
            )}
            {borrowError && <div role="alert" className="mt-4 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{borrowError}</div>}

            {canBorrow ? (
              <form onSubmit={handleBorrowSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">Purpose of Use</label>
                  <textarea
                    name="purpose"
                    rows="3"
                    required
                    value={borrowForm.purpose}
                    onChange={(event) => setBorrowForm({ ...borrowForm, purpose: event.target.value })}
                    placeholder="Enter purpose..."
                    className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-[#1f5ff0] focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <DateInput label="From Date" value={borrowForm.startDate} onChange={(value) => setBorrowForm({ ...borrowForm, startDate: value })} />
                  <DateInput label="To Date" value={borrowForm.endDate} onChange={(value) => setBorrowForm({ ...borrowForm, endDate: value })} />
                </div>
                <button
                  disabled={equipment.available === 0 || submitting}
                  className="w-full rounded-md bg-[#1f5ff0] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {equipment.available === 0 ? 'Out of Stock' : submitting ? 'Submitting…' : 'Submit Request'}
                </button>
              </form>
            ) : (
              <div className="mt-4 rounded-md border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                This role can inspect equipment details, QR codes, manuals, and location guidance. Borrow requests are submitted from Student accounts.
              </div>
            )}
          </section>

          <EquipmentQRCode equipment={equipment} />

          <section className="rounded-lg border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
              <h3 className="text-sm font-bold text-slate-900">Announcements</h3>
              <Link to="/announcements" className="text-xs font-bold text-[#1f5ff0] hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {announcements.slice(0, 3).map((item) => (
                <Link key={item.id} to="/announcements" className="flex gap-3 p-4 transition hover:bg-slate-50">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${item.isNew ? 'bg-blue-50 text-[#1f5ff0]' : 'bg-amber-50 text-amber-600'}`}>
                    <Bell size={14} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-sm font-bold leading-tight text-slate-900">{item.title}</span>
                      {item.isNew && <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-500">New</span>}
                    </span>
                    <span className="mt-1 block text-[11px] text-slate-500">{item.dept}</span>
                    <span className="mt-0.5 block text-[10px] text-slate-400">{item.date}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

const Meta = ({ label, value, valueClass = 'text-slate-600' }) => (
  <div>
    <span className="font-semibold text-slate-800">{label}: </span>
    <span className={`font-medium ${valueClass}`}>{value || 'N/A'}</span>
  </div>
);

const Spec = ({ label, value }) => (
  <div className="rounded-md bg-slate-50 p-3">
    <p className="text-[11px] font-medium text-slate-500">{label}</p>
    <p className="mt-1 truncate text-sm font-bold text-slate-900">{value || 'N/A'}</p>
  </div>
);

const DateInput = ({ label, value, onChange }) => (
  <div>
    <label className="mb-1.5 block text-xs font-bold text-slate-700">{label}</label>
    <div className="relative">
      <CalendarDays className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
      <input
        type="date"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 pr-8 text-xs font-medium text-slate-700 outline-none transition focus:border-[#1f5ff0] focus:bg-white focus:ring-2 focus:ring-blue-100"
      />
    </div>
  </div>
);

const ResourceIcon = ({ type }) => {
  const className = 'h-6 w-6';
  if (type === 'video') return <Video className={`${className} text-red-500`} />;
  if (type === 'image') return <ImageIcon className={`${className} text-blue-500`} />;
  if (type === 'warning') return <AlertTriangle className={`${className} text-amber-500`} />;
  if (type === 'spec') return <Info className={`${className} text-slate-500`} />;
  return <FileText className={`${className} text-red-500`} />;
};

const PackageFallback = () => (
  <div className="grid h-full min-h-32 w-full place-items-center bg-slate-100 text-slate-300">
    <Info size={38} />
  </div>
);

const parseList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const openResource = (url) => {
  if (!url || url === '#') return;
  window.open(url, '_blank', 'noopener,noreferrer');
};

export default EquipmentDetail;

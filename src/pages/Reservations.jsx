import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle,
  Clock,
  FileText,
  Package,
  Search,
  User,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { borrowRequests } from '../data/demoData';
import API_BASE_URL from '../config/api';

const Reservations = () => {
  const [requests, setRequests] = useState(borrowRequests);
  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/api/reservations/all`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then((response) => {
        if (!response.ok) throw new Error('Reservations could not be loaded.');
        return response.json();
      })
      .then((data) => active && setRequests(data))
      .catch(() => active && setMessage('Live reservations are temporarily unavailable; demonstration records are shown.'));
    return () => { active = false; };
  }, []);

  const filteredRequests = useMemo(() => {
    const term = search.toLowerCase();
    return requests.filter((request) => (
      request.Equipment.name.toLowerCase().includes(term) ||
      request.User.fullName.toLowerCase().includes(term) ||
      request.status.toLowerCase().includes(term)
    ));
  }, [requests, search]);

  const stats = {
    total: requests.length,
    pending: requests.filter((item) => item.status === 'Pending').length,
    approved: requests.filter((item) => ['Approved', 'Borrowed'].includes(item.status)).length,
  };

  const updateStatus = async (id, status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Reservation could not be updated.');
      setRequests((current) => current.map((item) => item.id === id ? result : item));
      setSelectedRequest(null);
      setMessage(`${id} is now ${status.toLowerCase()}.`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Borrow Requests</h1>
          <p className="mt-1 text-xs font-medium text-slate-500">Review student requests, issue approved equipment, and process returns.</p>
        </div>
        <div className="flex rounded-lg bg-slate-100 p-1">
          <TabButton active={view === 'list'} onClick={() => setView('list')}>List View</TabButton>
          <TabButton active={view === 'analytics'} onClick={() => setView('analytics')}>Analytics</TabButton>
        </div>
      </div>

      {message && <p role="status" className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-800">{message}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="Total Requests" value={stats.total} icon={CalendarDays} color="text-[#1f5ff0] bg-blue-50" />
        <StatCard title="Pending Review" value={stats.pending} icon={Clock} color="text-amber-600 bg-amber-50" />
        <StatCard title="Confirmed" value={stats.approved} icon={CheckCircle} color="text-emerald-600 bg-emerald-50" />
      </div>

      {view === 'list' ? (
        <section className="rounded-lg border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-sm font-bold text-slate-900">Active Pipeline</h2>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search requests..."
                className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#1f5ff0] focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 p-2">
            {filteredRequests.map((request) => (
              <article key={request.id} className="grid gap-4 rounded-lg p-3 transition hover:bg-slate-50 lg:grid-cols-[1fr_auto]">
                <div className="flex min-w-0 gap-4">
                  <Link to={`/equipment/${request.Equipment.id}`} className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                    {request.Equipment.image ? <img src={request.Equipment.image} alt="" className="h-full w-full object-cover" /> : <Package size={24} className="text-slate-400" />}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">{request.Equipment.category}</span>
                      <StatusBadge status={request.status} />
                    </div>
                    <h3 className="truncate text-sm font-bold text-slate-900">{request.Equipment.name} ({request.Equipment.assetTag})</h3>
                    <div className="mt-2 grid gap-3 text-xs text-slate-500 md:grid-cols-3">
                      <span className="flex items-center gap-2"><User size={14} /> {request.User.fullName}</span>
                      <span>{request.User.department}</span>
                      <span className="flex items-center gap-2"><CalendarDays size={14} /> {formatDate(request.startDate)} - {formatDate(request.endDate)}</span>
                    </div>
                    <p className="mt-3 line-clamp-2 rounded-md bg-slate-50 p-3 text-xs leading-5 text-slate-500">"{request.purpose}"</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 lg:min-w-[280px]">
                  <button onClick={() => setSelectedRequest(request)} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50">
                    <FileText size={14} />
                    Proof
                  </button>
                  {request.status === 'Pending' && (
                    <>
                      <button onClick={() => updateStatus(request.id, 'Approved')} className="inline-flex items-center gap-2 rounded-md bg-[#1f5ff0] px-3 py-2 text-xs font-bold text-white">
                        <Check size={14} />
                        Approve
                      </button>
                      <button onClick={() => updateStatus(request.id, 'Cancelled')} className="inline-flex items-center gap-2 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
                        <X size={14} />
                        Reject
                      </button>
                    </>
                  )}
                  {request.status === 'Approved' && (
                    <button onClick={() => updateStatus(request.id, 'Borrowed')} className="rounded-md bg-slate-900 px-3 py-2 text-xs font-bold text-white">
                      Issue Hardware
                    </button>
                  )}
                  {request.status === 'Borrowed' && (
                    <button onClick={() => updateStatus(request.id, 'Returned')} className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-bold text-white">
                      Process Return
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <Analytics requests={requests} />
      )}

      {selectedRequest && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Formal Asset Application</h2>
                <p className="text-xs text-slate-500">Review student credentials and request context.</p>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-5 p-5 md:grid-cols-[1fr_260px]">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoBox label="Full Name" value={selectedRequest.User.fullName} />
                  <InfoBox label="Reg Number" value={selectedRequest.User.studentId} />
                  <InfoBox label="Phone Number" value={selectedRequest.phoneNumber} />
                  <InfoBox label="Department" value={selectedRequest.User.department} />
                </div>
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Reason for Request</p>
                  <div className="rounded-md border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-600">"{selectedRequest.purpose}"</div>
                </div>
              </div>
              <aside className="space-y-4">
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-blue-500">Target Equipment</p>
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-md border border-blue-100 bg-white">
                      {selectedRequest.Equipment.image ? <img src={selectedRequest.Equipment.image} alt="" className="h-full w-full object-cover" /> : <Package size={22} className="text-blue-500" />}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{selectedRequest.Equipment.name}</p>
                      <p className="text-[11px] font-bold text-blue-600">{selectedRequest.Equipment.assetTag}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm">
                  <div className="flex justify-between py-2"><span className="text-slate-500">Pickup</span><b>{formatDate(selectedRequest.startDate)}</b></div>
                  <div className="flex justify-between py-2"><span className="text-slate-500">Deadline</span><b className="text-red-600">{formatDate(selectedRequest.endDate)}</b></div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Analytics = ({ requests }) => {
  const statuses = ['Pending', 'Approved', 'Borrowed', 'Returned', 'Cancelled'];
  const max = Math.max(...statuses.map((status) => requests.filter((item) => item.status === status).length), 1);
  const categories = [...new Set(requests.map((item) => item.Equipment.category))];

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-5 flex items-center gap-2 text-sm font-bold text-slate-900"><BarChart3 size={16} /> Status Distribution</h2>
        <div className="space-y-4">
          {statuses.map((status) => {
            const value = requests.filter((item) => item.status === status).length;
            return <ProgressRow key={status} label={status} value={value} percent={(value / max) * 100} />;
          })}
        </div>
      </section>
      <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-5 flex items-center gap-2 text-sm font-bold text-slate-900"><Package size={16} /> Asset Categories</h2>
        <div className="space-y-4">
          {categories.map((category) => {
            const value = requests.filter((item) => item.Equipment.category === category).length;
            return <ProgressRow key={category} label={category} value={value} percent={(value / requests.length) * 100} color="bg-emerald-500" />;
          })}
        </div>
      </section>
    </div>
  );
};

const TabButton = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`rounded-md px-4 py-2 text-xs font-bold transition ${active ? 'bg-white text-[#1f5ff0] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
    {children}
  </button>
);

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{title}</p>
        <h3 className="mt-1 text-2xl font-bold text-slate-900">{String(value).padStart(2, '0')}</h3>
      </div>
      <span className={`grid h-10 w-10 place-items-center rounded-md ${color}`}>
        <Icon size={18} />
      </span>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    Pending: 'bg-amber-50 text-amber-700 border-amber-100',
    Approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Borrowed: 'bg-blue-50 text-blue-700 border-blue-100',
    Returned: 'bg-slate-100 text-slate-600 border-slate-200',
    Cancelled: 'bg-red-50 text-red-600 border-red-100',
  };
  return <span className={`rounded-md border px-2 py-1 text-[10px] font-bold ${styles[status] || styles.Pending}`}>{status}</span>;
};

const ProgressRow = ({ label, value, percent, color = 'bg-[#1f5ff0]' }) => (
  <div>
    <div className="mb-2 flex items-center justify-between text-xs">
      <span className="font-bold text-slate-600">{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(4, percent)}%` }} />
    </div>
  </div>
);

const InfoBox = ({ label, value }) => (
  <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-bold text-slate-900">{value || 'N/A'}</p>
  </div>
);

const formatDate = (value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default Reservations;

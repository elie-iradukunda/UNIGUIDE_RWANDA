import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, CheckCircle, Clock, Package, Search, ShoppingBag, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { borrowRequests } from '../data/demoData';
import API_BASE_URL from '../config/api';
import { handleImageError } from '../utils/imageFallback';

const MyItems = ({ initialView = 'requests' }) => {
  const [requests, setRequests] = useState(borrowRequests);
  const [view, setView] = useState(initialView);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/api/reservations/my`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then((response) => {
        if (!response.ok) throw new Error('Requests could not be loaded.');
        return response.json();
      })
      .then((data) => active && setRequests(data))
      .catch(() => active && setMessage('Live requests are temporarily unavailable; demonstration records are shown.'));
    return () => { active = false; };
  }, []);

  const activeItems = requests.filter((item) => ['Approved', 'Borrowed', 'Pending', 'Overdue'].includes(item.status));
  const approvedItems = requests.filter((item) => ['Approved', 'Borrowed'].includes(item.status));
  const historyItems = requests.filter((item) => ['Returned', 'Cancelled'].includes(item.status));

  const visibleItems = useMemo(() => {
    const source = view === 'approved' ? approvedItems : view === 'history' ? historyItems : activeItems;
    const term = search.toLowerCase();
    return source.filter((item) => item.Equipment.name.toLowerCase().includes(term) || item.Equipment.assetTag.toLowerCase().includes(term) || item.status.toLowerCase().includes(term));
  }, [view, search, activeItems, approvedItems, historyItems]);

  const cancelRequest = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ status: 'Cancelled' }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Request could not be cancelled.');
      setRequests((current) => current.map((item) => item.id === id ? result : item));
      setMessage('The pending request was cancelled.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{view === 'approved' ? 'My Approved Equipment' : 'My Borrow Requests'}</h1>
          <p className="mt-1 text-xs font-medium text-slate-500">Track requests, approved equipment, return dates, and borrowing history.</p>
        </div>
        <div className="flex rounded-lg bg-slate-100 p-1">
          <TabButton active={view === 'requests'} onClick={() => setView('requests')}>Current</TabButton>
          <TabButton active={view === 'approved'} onClick={() => setView('approved')}>Approved</TabButton>
          <TabButton active={view === 'history'} onClick={() => setView('history')}>History</TabButton>
        </div>
      </div>

      {message && <p role="status" className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-800">{message}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="Active Loans" value={approvedItems.length} icon={Clock} color="text-[#1f5ff0] bg-blue-50" />
        <StatCard title="Pending Approvals" value={activeItems.filter((item) => item.status === 'Pending').length} icon={AlertCircle} color="text-amber-600 bg-amber-50" />
        <StatCard title="Total Returned" value={historyItems.filter((item) => item.status === 'Returned').length} icon={CheckCircle} color="text-emerald-600 bg-emerald-50" />
      </div>

      <section className="rounded-lg border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <ShoppingBag size={16} />
            {view === 'history' ? 'Past History' : 'Active Requests & Loans'}
          </h2>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search requests..."
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#1f5ff0] focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {visibleItems.length === 0 ? (
          <div className="grid place-items-center px-6 py-16 text-center">
            <Package className="mb-3 text-slate-200" size={42} />
            <p className="text-sm font-semibold text-slate-400">No matching items in this view.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map((item) => (
              <article key={item.id} className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm transition hover:border-blue-100 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                      {item.Equipment.image ? <img src={item.Equipment.image} alt="" onError={handleImageError} className="h-full w-full object-cover" /> : <Package size={21} className="text-slate-400" />}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-slate-900">{item.Equipment.name}</h3>
                      <p className="mt-0.5 text-[11px] font-bold text-[#1f5ff0]">{item.Equipment.assetTag}</p>
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                <p className="mt-4 line-clamp-2 text-xs leading-5 text-slate-500">"{item.purpose}"</p>

                <div className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-3">
                  <DateBlock label="Start Date" value={item.startDate} />
                  <DateBlock label="End Date" value={item.endDate} />
                </div>

                <div className="mt-4 flex gap-2">
                  <Link to={`/equipment/${item.Equipment.id}`} className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-bold text-slate-700 transition hover:bg-blue-50 hover:text-[#1f5ff0]">
                    Details
                  </Link>
                  {item.status === 'Pending' && (
                    <button onClick={() => cancelRequest(item.id)} className="rounded-md px-3 py-2 text-xs font-bold text-red-500 transition hover:bg-red-50">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
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

const DateBlock = ({ label, value }) => (
  <div>
    <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
      <CalendarDays size={12} />
      {label}
    </p>
    <p className="text-xs font-bold text-slate-800">{new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    Approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Pending: 'bg-amber-50 text-amber-700 border-amber-100',
    Borrowed: 'bg-blue-50 text-blue-700 border-blue-100',
    Returned: 'bg-slate-100 text-slate-600 border-slate-200',
    Cancelled: 'bg-red-50 text-red-600 border-red-100',
  };
  return <span className={`rounded-md border px-2 py-1 text-[10px] font-bold ${styles[status] || styles.Pending}`}>{status}</span>;
};

export default MyItems;

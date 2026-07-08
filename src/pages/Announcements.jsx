import { useEffect, useMemo, useState } from 'react';
import { Bell, Megaphone, Plus, Search, ShieldAlert, Trash2, Wrench, X } from 'lucide-react';
import { announcements as demoAnnouncements } from '../data/demoData';
import API_BASE_URL from '../config/api';

const toViewAnnouncement = (item) => ({
  ...item,
  dept: item.dept || item.department || 'All Departments',
  message: item.message || item.content || '',
  date: item.date || new Date(item.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
  type: item.type || 'notice',
});

const Announcements = () => {
  const [items, setItems] = useState(demoAnnouncements);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [role] = useState(() => localStorage.getItem('userRole'));
  const canPublish = ['Admin', 'HOD', 'Lab Staff'].includes(role);
  const canDelete = ['Admin', 'HOD'].includes(role);

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/api/announcements`)
      .then((response) => {
        if (!response.ok) throw new Error('Announcements could not be loaded.');
        return response.json();
      })
      .then((data) => active && setItems(data.map(toViewAnnouncement)))
      .catch(() => active && setMessage('Live announcements are temporarily unavailable; verified local notices are shown.'));
    return () => { active = false; };
  }, []);

  const filteredItems = useMemo(() => {
    const term = search.toLowerCase();
    return items.filter((item) => item.title.toLowerCase().includes(term) || item.dept.toLowerCase().includes(term) || item.message.toLowerCase().includes(term));
  }, [items, search]);

  const addAnnouncement = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${API_BASE_URL}/api/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ title: data.get('title'), department: data.get('dept'), content: data.get('message'), type: data.get('type'), isNew: true }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Announcement could not be published.');
      setItems((current) => [toViewAnnouncement(result), ...current]);
      setShowModal(false);
      setMessage('Announcement published successfully.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const deleteAnnouncement = async (item) => {
    if (!window.confirm(`Remove "${item.title}"?`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/announcements/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Announcement could not be removed.');
      setItems((current) => current.filter((record) => record.id !== item.id));
      setMessage('Announcement removed.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Announcements</h1>
          <p className="mt-1 text-xs font-medium text-slate-500">Publish notices for lab safety, workshops, exams, and maintenance windows.</p>
        </div>
        {canPublish && <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 rounded-md bg-[#1f5ff0] px-4 py-2.5 text-xs font-bold text-white shadow-sm">
          <Plus size={15} />
          New Announcement
        </button>}
      </div>

      {message && <p role="status" className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-800">{message}</p>}

      <section className="rounded-lg border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Megaphone size={16} /> Notice Board</h2>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search announcements..."
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#1f5ff0] focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
          {filteredItems.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-100 p-4 transition hover:border-blue-100 hover:bg-blue-50/20">
              <div className="flex items-start gap-3">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${iconBg(item.type)}`}>
                  <AnnouncementIcon type={item.type} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.isNew && <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-500">New</span>}
                      {canDelete && (
                        <button onClick={() => deleteAnnouncement(item)} title="Remove announcement" className="grid h-6 w-6 place-items-center rounded text-slate-400 transition hover:bg-red-50 hover:text-red-500">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-400">{item.dept} · {item.date}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.message}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <form onSubmit={addAnnouncement} className="w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">New Announcement</h2>
                <p className="text-xs text-slate-500">Share a notice with students and staff.</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <Input name="title" label="Title" placeholder="Lab Safety Briefing" required />
              <Input name="dept" label="Department" placeholder="Mechatronics Dept." required />
              <label className="space-y-1.5 block">
                <span className="block text-xs font-bold text-slate-600">Type</span>
                <select name="type" className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#1f5ff0]">
                  <option value="safety">Safety</option>
                  <option value="workshop">Workshop</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="exam">Exam</option>
                </select>
              </label>
              <label className="space-y-1.5 block">
                <span className="block text-xs font-bold text-slate-600">Message</span>
                <textarea name="message" rows="4" required className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#1f5ff0]" />
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4">
              <button type="button" onClick={() => setShowModal(false)} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600">Cancel</button>
              <button className="rounded-md bg-[#1f5ff0] px-4 py-2 text-xs font-bold text-white">Publish</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const Input = ({ label, ...props }) => (
  <label className="space-y-1.5 block">
    <span className="block text-xs font-bold text-slate-600">{label}</span>
    <input {...props} className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#1f5ff0]" />
  </label>
);

const AnnouncementIcon = ({ type }) => {
  if (type === 'safety') return <ShieldAlert size={18} />;
  if (type === 'maintenance') return <Wrench size={18} />;
  return <Bell size={18} />;
};

const iconBg = (type) => {
  if (type === 'safety') return 'bg-blue-50 text-[#1f5ff0]';
  if (type === 'workshop') return 'bg-amber-50 text-amber-600';
  if (type === 'maintenance') return 'bg-slate-100 text-slate-600';
  return 'bg-emerald-50 text-emerald-600';
};

export default Announcements;

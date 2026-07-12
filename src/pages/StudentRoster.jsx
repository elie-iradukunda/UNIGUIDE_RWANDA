import { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeCheck, CheckCircle2, ClipboardList, Plus, RotateCcw, Search, Trash2, Upload, UserX, X } from 'lucide-react';
import API_BASE_URL from '../config/api';

const DEPARTMENTS = ['Renewable Energy', 'Mechatronic', 'ICT', 'Electronic and Telecommunication'];

const StudentRoster = () => {
  const [entries, setEntries] = useState([]);
  const [totals, setTotals] = useState({ total: 0, claimed: 0 });
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [csv, setCsv] = useState('');
  const [busy, setBusy] = useState(false);

  const isAdmin = localStorage.getItem('userRole') === 'Admin';
  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }), []);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/roster`, { headers: authHeaders });
      if (!response.ok) throw new Error('The enrolment list could not be loaded.');
      const data = await response.json();
      setEntries(data.entries || []);
      setTotals({ total: data.total || 0, claimed: data.claimed || 0 });
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [authHeaders]);

  useEffect(() => { load(); }, [load]);

  const call = async (path, options) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, { headers: authHeaders, ...options });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'The request failed.');
      setMessage(data.message || 'Saved.');
      await load();
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const addStudent = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const created = await call('/api/roster', {
      method: 'POST',
      body: JSON.stringify({
        studentId: form.get('studentId'),
        fullName: form.get('fullName'),
        department: form.get('department'),
      }),
    });
    if (created) setShowAdd(false);
  };

  const importCsv = async (event) => {
    event.preventDefault();
    const result = await call('/api/roster/import', { method: 'POST', body: JSON.stringify({ csv }) });
    if (result) {
      setShowImport(false);
      setCsv('');
    }
  };

  const setStatus = (entry, status) =>
    call(`/api/roster/${entry.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });

  const release = (entry) => {
    if (!window.confirm(`Release ${entry.studentId}? The account registered with it will be deleted so the student can sign up again.`)) return;
    call(`/api/roster/${entry.id}/release`, { method: 'POST' });
  };

  const remove = (entry) => {
    if (!window.confirm(`Remove ${entry.studentId} from the enrolment list?`)) return;
    call(`/api/roster/${entry.id}`, { method: 'DELETE' });
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return entries;
    return entries.filter((entry) =>
      entry.studentId.toLowerCase().includes(term)
      || String(entry.fullName || '').toLowerCase().includes(term));
  }, [entries, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2c3e50]">Student Enrolment List</h1>
          <p className="text-sm text-[#6b7280] mt-1 max-w-2xl">
            Only a student ID on this list can open an account. The department recorded here is the one
            the student receives, so it cannot be chosen on the sign-up form.
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => setShowImport(true)} className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[#2c3e50] hover:bg-gray-50">
              <Upload size={16} /> Import list
            </button>
            <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-md bg-[#1f4fa3] px-3 py-2 text-sm font-semibold text-white hover:bg-[#173e82]">
              <Plus size={16} /> Add student
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={ClipboardList} label="On the list" value={totals.total} />
        <StatCard icon={CheckCircle2} label="Account opened" value={totals.claimed} />
        <StatCard icon={BadgeCheck} label="Not yet registered" value={Math.max(0, totals.total - totals.claimed)} />
      </div>

      {error && <Banner tone="error">{error}</Banner>}
      {message && <Banner tone="success">{message}</Banner>}

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-4">
          <div className="relative max-w-sm">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by student ID or name..."
              className="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:border-[#1f4fa3] focus:outline-none"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-[#6b7280]">
              <tr>
                <th className="px-4 py-3 font-semibold">Student ID</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold">Enrolment</th>
                <th className="px-4 py-3 font-semibold">Account</th>
                {isAdmin && <th className="px-4 py-3 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-semibold text-[#2c3e50]">{entry.studentId}</td>
                  <td className="px-4 py-3 text-[#2c3e50]">{entry.fullName || '—'}</td>
                  <td className="px-4 py-3 text-[#6b7280]">{entry.department}</td>
                  <td className="px-4 py-3">
                    <Pill tone={entry.status === 'Enrolled' ? 'green' : 'gray'}>{entry.status}</Pill>
                  </td>
                  <td className="px-4 py-3">
                    {entry.claimedAt
                      ? <span className="text-xs text-[#6b7280]" title={entry.claimedByEmail}>{entry.claimedByEmail}</span>
                      : <Pill tone="amber">Not registered</Pill>}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {entry.status === 'Enrolled' ? (
                          <IconButton title="Mark withdrawn" onClick={() => setStatus(entry, 'Withdrawn')} disabled={busy}>
                            <UserX size={15} />
                          </IconButton>
                        ) : (
                          <IconButton title="Mark enrolled" onClick={() => setStatus(entry, 'Enrolled')} disabled={busy}>
                            <BadgeCheck size={15} />
                          </IconButton>
                        )}
                        {entry.claimedAt && (
                          <IconButton title="Release this student ID" onClick={() => release(entry)} disabled={busy}>
                            <RotateCcw size={15} />
                          </IconButton>
                        )}
                        {!entry.claimedAt && (
                          <IconButton title="Remove from list" onClick={() => remove(entry)} disabled={busy} danger>
                            <Trash2 size={15} />
                          </IconButton>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-4 py-10 text-center text-sm text-[#6b7280]">
                    No students on the enrolment list yet. Import the registry export to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <Modal title="Add a student to the enrolment list" onClose={() => setShowAdd(false)}>
          <form onSubmit={addStudent} className="space-y-4">
            <Field label="Student ID" name="studentId" placeholder="e.g. 23RP00123" required />
            <Field label="Full Name" name="fullName" placeholder="e.g. Jean Uwimana" />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#6b7280]">Department</label>
              <select name="department" required className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-[#1f4fa3] focus:outline-none">
                <option value="">Select department...</option>
                {DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
              </select>
            </div>
            <button type="submit" disabled={busy} className="w-full rounded-md bg-[#1f4fa3] py-2.5 text-sm font-semibold text-white hover:bg-[#173e82] disabled:opacity-60">
              Add to list
            </button>
          </form>
        </Modal>
      )}

      {showImport && (
        <Modal title="Import the registry export" onClose={() => setShowImport(false)}>
          <form onSubmit={importCsv} className="space-y-4">
            <p className="text-sm text-[#6b7280]">
              Paste one student per line as <span className="font-mono text-xs">studentId, fullName, department</span>.
              A header row is ignored. Existing rows are updated; students who already registered are left untouched.
            </p>
            <textarea
              value={csv}
              onChange={(event) => setCsv(event.target.value)}
              rows={10}
              required
              placeholder={'23RP00123, Jean Uwimana, Mechatronic\n23RP00124, Aline Mukamana, ICT\n23RP00125, Patrick Habimana, Renewable Energy'}
              className="w-full rounded-md border border-gray-200 bg-gray-50 p-3 font-mono text-xs focus:border-[#1f4fa3] focus:outline-none"
            />
            <button type="submit" disabled={busy} className="w-full rounded-md bg-[#1f4fa3] py-2.5 text-sm font-semibold text-white hover:bg-[#173e82] disabled:opacity-60">
              {busy ? 'Importing...' : 'Import students'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#1f4fa3]">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">{label}</p>
      <p className="text-xl font-bold text-[#2c3e50]">{value}</p>
    </div>
  </div>
);

const Pill = ({ tone, children }) => {
  const tones = {
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    gray: 'bg-gray-100 text-gray-600',
  };
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
};

const Banner = ({ tone, children }) => (
  <div className={`rounded-md p-3 text-sm ${tone === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
    {children}
  </div>
);

const IconButton = ({ children, danger, ...props }) => (
  <button
    type="button"
    {...props}
    className={`rounded-md border p-1.5 transition-colors disabled:opacity-50 ${
      danger
        ? 'border-red-100 text-red-500 hover:bg-red-50'
        : 'border-gray-200 text-[#6b7280] hover:bg-gray-50'
    }`}
  >
    {children}
  </button>
);

const Field = ({ label, ...props }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-medium text-[#6b7280]">{label}</label>
    <input {...props} className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-[#1f4fa3] focus:outline-none" />
  </div>
);

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#2c3e50]">{title}</h2>
        <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
          <X size={18} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default StudentRoster;

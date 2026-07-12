import { useCallback, useEffect, useMemo, useState } from 'react';
import { Accessibility, Building2, Clock3, Landmark, MapPin, Navigation, Pencil, Phone, Plus, Search, Trash2, X } from 'lucide-react';
import API_BASE_URL from '../config/api';

const DEPARTMENTS = ['Renewable Energy', 'Mechatronic', 'ICT', 'Electronic and Telecommunication'];
const MANAGER_ROLES = ['Admin', 'HOD', 'Lab Staff'];

export default function LabGuide() {
  const [locations, setLocations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {...lab} = edit
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const role = localStorage.getItem('userRole');
  const myDepartment = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}').department || null; } catch { return null; }
  }, []);
  const canManage = MANAGER_ROLES.includes(role);
  // A Head of Department or Lab Staff owns only their own department's laboratories.
  const owns = (lab) => role === 'Admin' || (myDepartment && lab?.department === myDepartment);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lab-locations`);
      if (!response.ok) throw new Error('Laboratory guides could not be loaded.');
      const data = await response.json();
      setLocations(data);
      setSelectedId((current) => (data.some((lab) => lab.id === current) ? current : data[0]?.id ?? null));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    setBusy(true);
    setError('');
    try {
      const isNew = !editing?.id;
      const response = await fetch(`${API_BASE_URL}/api/lab-locations${isNew ? '' : `/${editing.id}`}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'The laboratory could not be saved.');
      setEditing(null);
      await load();
      if (data.id) setSelectedId(data.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (lab) => {
    if (!window.confirm(`Remove the guide for ${lab.name}? Students will no longer see directions to it.`)) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/lab-locations/${lab.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'The laboratory could not be removed.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return locations;
    // Staff-created laboratories may leave building or room blank, so never assume a string.
    return locations.filter((lab) =>
      [lab.name, lab.building, lab.department, lab.room]
        .some((field) => String(field || '').toLowerCase().includes(value)));
  }, [locations, search]);

  const selected = locations.find((lab) => lab.id === selectedId) || filtered[0] || locations[0];

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#1f5ff0]">Accessible Campus Navigation</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Laboratory Location Guide</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Find the correct building, room, landmarks, opening hours, and a step-free route before collecting or using equipment.
          </p>
        </div>
        {canManage && (
          <button onClick={() => setEditing({})} className="inline-flex items-center gap-2 rounded-md bg-[#1f5ff0] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700">
            <Plus size={16} /> Add laboratory
          </button>
        )}
      </header>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
        <label htmlFor="lab-search" className="sr-only">Search laboratories</label>
        <input id="lab-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search laboratory, building, department, or room…" className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-[#1f5ff0] focus:ring-2 focus:ring-blue-100" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[330px_1fr]">
        <nav aria-label="Laboratory list" className="space-y-2 rounded-lg border border-slate-100 bg-white p-3 shadow-sm">
          {filtered.map((lab) => (
            <button key={lab.id} onClick={() => setSelectedId(lab.id)} aria-current={selected?.id === lab.id ? 'location' : undefined} className={`w-full rounded-lg border p-4 text-left transition ${selected?.id === lab.id ? 'border-blue-200 bg-blue-50' : 'border-transparent hover:bg-slate-50'}`}>
              <span className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-[#1f5ff0] shadow-sm"><MapPin size={18} /></span>
                <span>
                  <span className="block text-sm font-bold text-slate-900">{lab.name}</span>
                  <span className="mt-1 block text-xs text-slate-500">{[lab.building, lab.room].filter(Boolean).join(' · ') || lab.department}</span>
                </span>
              </span>
            </button>
          ))}
          {!filtered.length && (
            <p className="p-6 text-center text-sm font-semibold text-slate-400">
              {locations.length ? 'No laboratory matches that search.' : 'No laboratory guides yet.'}
            </p>
          )}
        </nav>

        {selected && (
          <main className="space-y-5" aria-live="polite">
            <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1f5ff0]">{selected.department}</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">{selected.name}</h2>
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                    <Building2 size={16} /> {[selected.building, selected.floor, selected.room && `Room ${selected.room}`].filter(Boolean).join(', ') || 'Location not recorded'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  {selected.openingHours && (
                    <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
                      <p className="flex items-center gap-2 font-bold text-slate-800"><Clock3 size={16} /> Opening hours</p>
                      <p className="mt-1 text-xs text-slate-600">{selected.openingHours}</p>
                    </div>
                  )}
                  {canManage && owns(selected) && (
                    <div className="flex gap-2">
                      <button onClick={() => setEditing(selected)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                        <Pencil size={14} /> Edit
                      </button>
                      <button onClick={() => remove(selected)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-md border border-red-100 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-2">
              <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm" aria-labelledby="landmark-heading">
                <h3 id="landmark-heading" className="flex items-center gap-2 text-sm font-bold text-slate-900"><Landmark size={17} className="text-[#1f5ff0]" /> Landmark Directions</h3>
                <ol className="mt-4 space-y-3">
                  {(selected.landmarks || []).map((step, index) => (
                    <li key={step} className="flex gap-3 text-sm leading-6 text-slate-600">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-bold text-[#1f5ff0]">{index + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                  {!(selected.landmarks || []).length && <li className="text-sm text-slate-400">No landmark directions recorded yet.</li>}
                </ol>
              </section>

              <section className="rounded-lg border border-emerald-100 bg-emerald-50 p-5" aria-labelledby="accessible-heading">
                <h3 id="accessible-heading" className="flex items-center gap-2 text-sm font-bold text-emerald-900"><Accessibility size={18} /> Step-Free Accessible Route</h3>
                <p className="mt-3 text-sm leading-6 text-emerald-900/80">
                  {selected.accessibleRoute || 'No step-free route has been recorded for this laboratory yet.'}
                </p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {(selected.accessibility || []).map((feature) => (
                    <li key={feature} className="flex items-center gap-2 rounded-md bg-white/70 px-3 py-2 text-xs font-bold text-emerald-800"><Navigation size={14} /> {feature}</li>
                  ))}
                </ul>
              </section>
            </div>

            {selected.contact && (
              <section className="flex flex-col justify-between gap-3 rounded-lg border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-bold text-slate-900">Need assistance locating this laboratory?</p>
                  <p className="mt-1 text-xs text-slate-500">Contact the responsible laboratory office before your booking.</p>
                </div>
                <a href={`tel:${String(selected.contact).replace(/\s/g, '')}`} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#08162d] px-4 py-2.5 text-sm font-bold text-white">
                  <Phone size={16} /> {selected.contact}
                </a>
              </section>
            )}
          </main>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editing.id ? `Edit ${editing.name}` : 'Add a laboratory'}</h2>
              <button onClick={() => setEditing(null)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>

            <form onSubmit={save} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Laboratory name" name="name" defaultValue={editing.name} required placeholder="e.g. Automation Lab" />
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-500">Department</label>
                  <select
                    name="department"
                    required
                    defaultValue={editing.department || (role === 'Admin' ? '' : myDepartment || '')}
                    disabled={role !== 'Admin'}
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-[#1f5ff0] focus:outline-none disabled:opacity-70"
                  >
                    <option value="">Select department...</option>
                    {DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
                  </select>
                  {role !== 'Admin' && <p className="text-[11px] text-slate-400">You can only manage your own department.</p>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Building" name="building" defaultValue={editing.building} placeholder="Engineering Block" />
                <Field label="Floor" name="floor" defaultValue={editing.floor} placeholder="Ground Floor" />
                <Field label="Room" name="room" defaultValue={editing.room} placeholder="A-G06" />
              </div>

              <TextArea
                label="Landmark directions (one per line)"
                name="landmarks"
                rows={4}
                defaultValue={(editing.landmarks || []).join('\n')}
                placeholder={'Enter through the north workshop gate\nContinue past the fabrication room\nThe lab is beside the control room'}
              />

              <TextArea
                label="Step-free accessible route"
                name="accessibleRoute"
                rows={3}
                defaultValue={editing.accessibleRoute}
                placeholder="Use the north workshop ramp. The marked step-free route continues straight for 36 metres to A-G06."
              />

              <TextArea
                label="Accessibility features (one per line)"
                name="accessibility"
                rows={3}
                defaultValue={(editing.accessibility || []).join('\n')}
                placeholder={'Step-free route\nWide aisle\nAdjustable-height workstation'}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Opening hours" name="openingHours" defaultValue={editing.openingHours} placeholder="Monday–Friday, 08:00–17:00" />
                <Field label="Contact number" name="contact" defaultValue={editing.contact} placeholder="0788 220 126" />
              </div>

              <button type="submit" disabled={busy} className="w-full rounded-md bg-[#1f5ff0] py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60">
                {busy ? 'Saving…' : editing.id ? 'Save changes' : 'Add laboratory'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const Field = ({ label, ...props }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-medium text-slate-500">{label}</label>
    <input {...props} className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-[#1f5ff0] focus:outline-none" />
  </div>
);

const TextArea = ({ label, ...props }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-medium text-slate-500">{label}</label>
    <textarea {...props} className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-6 focus:border-[#1f5ff0] focus:outline-none" />
  </div>
);

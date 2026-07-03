import { useEffect, useMemo, useState } from 'react';
import { Accessibility, Building2, Clock3, Landmark, MapPin, Navigation, Phone, Search } from 'lucide-react';
import API_BASE_URL from '../config/api';

const fallbackLocations = [
  { id: 'lab-electronics-2', name: 'Electronics Lab 2', building: 'Engineering Block', floor: 'First Floor', department: 'Mechatronics', room: 'E-102', landmarks: ['Enter through the south reception', 'Use the first-floor east corridor', 'The laboratory is opposite the instrumentation store'], accessibleRoute: 'Use the ramp at the south entrance and the lift beside reception. Turn right on Floor 1; the lab is 24 metres along the east corridor.', accessibility: ['Step-free entrance', 'Lift access', '90 cm doorway', 'Accessible workbench'], openingHours: 'Monday–Friday, 08:00–17:00', contact: '0788 220 104' },
  { id: 'lab-ict', name: 'ICT Lab', building: 'ICT Block', floor: 'Ground Floor', department: 'ICT', room: 'ICT-G04', landmarks: ['Use the main ICT Block entrance', 'Pass the reception desk', 'The lab is the second door on the left'], accessibleRoute: 'The main ICT entrance is level with the courtyard. Follow the tactile strip past reception; ICT-G04 is 18 metres ahead on the left.', accessibility: ['Step-free entrance', 'Tactile route', 'Wide doorway', 'Accessible computer desk'], openingHours: 'Monday–Friday, 07:30–18:00', contact: '0788 220 118' },
  { id: 'lab-energy-1', name: 'Energy Lab 1', building: 'Energy Block', floor: 'First Floor', department: 'Renewable Energy', room: 'REN-105', landmarks: ['Enter from the library side', 'Take the lift to Floor 1', 'Follow signs for Renewable Energy'], accessibleRoute: 'Use the library-side ramp and lift. Exit on Floor 1 and follow the blue Renewable Energy signs for 30 metres.', accessibility: ['Ramp', 'Lift access', 'Low-height safety station', 'Accessible washroom nearby'], openingHours: 'Monday–Friday, 08:00–16:30', contact: '0788 220 132' },
  { id: 'lab-automation', name: 'Automation Lab', building: 'Engineering Block', floor: 'Ground Floor', department: 'Mechatronics', room: 'A-G06', landmarks: ['Enter through the north workshop gate', 'Continue past the fabrication room', 'Automation Lab is beside the control room'], accessibleRoute: 'Use the north workshop ramp. The marked step-free route continues straight for 36 metres to A-G06.', accessibility: ['Step-free route', 'High-contrast signs', 'Wide aisle', 'Adjustable-height PLC station'], openingHours: 'Monday–Friday, 08:00–17:00', contact: '0788 220 126' },
];

export default function LabGuide() {
  const [locations, setLocations] = useState(fallbackLocations);
  const [selectedId, setSelectedId] = useState(fallbackLocations[0].id);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/api/lab-locations`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Fallback')))
      .then((data) => { if (active && data.length) { setLocations(data); setSelectedId(data[0].id); } })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();
    return locations.filter((lab) => [lab.name, lab.building, lab.department, lab.room].some((field) => field.toLowerCase().includes(value)));
  }, [locations, search]);
  const selected = locations.find((lab) => lab.id === selectedId) || filtered[0] || locations[0];

  return (
    <div className="space-y-6 pb-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-[#1f5ff0]">Accessible Campus Navigation</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Laboratory Location Guide</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Find the correct building, room, landmarks, opening hours, and a step-free route before collecting or using equipment.</p>
      </header>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
        <label htmlFor="lab-search" className="sr-only">Search laboratories</label>
        <input id="lab-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search laboratory, building, department, or room…" className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-[#1f5ff0] focus:ring-2 focus:ring-blue-100" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[330px_1fr]">
        <nav aria-label="Laboratory list" className="space-y-2 rounded-lg border border-slate-100 bg-white p-3 shadow-sm">
          {filtered.map((lab) => <button key={lab.id} onClick={() => setSelectedId(lab.id)} aria-current={selected?.id === lab.id ? 'location' : undefined} className={`w-full rounded-lg border p-4 text-left transition ${selected?.id === lab.id ? 'border-blue-200 bg-blue-50' : 'border-transparent hover:bg-slate-50'}`}>
            <span className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-[#1f5ff0] shadow-sm"><MapPin size={18} /></span><span><span className="block text-sm font-bold text-slate-900">{lab.name}</span><span className="mt-1 block text-xs text-slate-500">{lab.building} · {lab.room}</span></span></span>
          </button>)}
          {!filtered.length && <p className="p-6 text-center text-sm font-semibold text-slate-400">No laboratory matches that search.</p>}
        </nav>

        {selected && <main className="space-y-5" aria-live="polite">
          <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div><p className="text-xs font-bold uppercase tracking-wider text-[#1f5ff0]">{selected.department}</p><h2 className="mt-1 text-xl font-bold text-slate-900">{selected.name}</h2><p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><Building2 size={16} /> {selected.building}, {selected.floor}, Room {selected.room}</p></div>
              <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm"><p className="flex items-center gap-2 font-bold text-slate-800"><Clock3 size={16} /> Opening hours</p><p className="mt-1 text-xs text-slate-600">{selected.openingHours}</p></div>
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-2">
            <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm" aria-labelledby="landmark-heading">
              <h3 id="landmark-heading" className="flex items-center gap-2 text-sm font-bold text-slate-900"><Landmark size={17} className="text-[#1f5ff0]" /> Landmark Directions</h3>
              <ol className="mt-4 space-y-3">{selected.landmarks.map((step, index) => <li key={step} className="flex gap-3 text-sm leading-6 text-slate-600"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-bold text-[#1f5ff0]">{index + 1}</span><span>{step}</span></li>)}</ol>
            </section>
            <section className="rounded-lg border border-emerald-100 bg-emerald-50 p-5" aria-labelledby="accessible-heading">
              <h3 id="accessible-heading" className="flex items-center gap-2 text-sm font-bold text-emerald-900"><Accessibility size={18} /> Step-Free Accessible Route</h3>
              <p className="mt-3 text-sm leading-6 text-emerald-900/80">{selected.accessibleRoute}</p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">{selected.accessibility.map((feature) => <li key={feature} className="flex items-center gap-2 rounded-md bg-white/70 px-3 py-2 text-xs font-bold text-emerald-800"><Navigation size={14} /> {feature}</li>)}</ul>
            </section>
          </div>
          <section className="flex flex-col justify-between gap-3 rounded-lg border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center"><div><p className="text-sm font-bold text-slate-900">Need assistance locating this laboratory?</p><p className="mt-1 text-xs text-slate-500">Contact the responsible laboratory office before your booking.</p></div><a href={`tel:${selected.contact.replace(/\s/g, '')}`} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#08162d] px-4 py-2.5 text-sm font-bold text-white"><Phone size={16} /> {selected.contact}</a></section>
        </main>}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Building2, Edit2, FlaskConical, Plus, Search, UserRound, UserX, X } from 'lucide-react';
import { departments as demoDepartments } from '../data/demoData';
import API_BASE_URL from '../config/api';

const Departments = () => {
  const [departments, setDepartments] = useState(demoDepartments);
  const [search, setSearch] = useState('');
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const isAdmin = localStorage.getItem('userRole') === 'Admin';

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/api/departments`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then((response) => {
        if (!response.ok) throw new Error('Departments could not be loaded.');
        return response.json();
      })
      .then((data) => active && setDepartments(data))
      .catch(() => active && setMessage('Live department data is temporarily unavailable; verified reference data is shown.'));
    return () => { active = false; };
  }, []);

  const filteredDepartments = useMemo(() => {
    const term = search.toLowerCase();
    return departments.filter((department) => department.name.toLowerCase().includes(term) || department.lead.toLowerCase().includes(term));
  }, [departments, search]);

  const openModal = (department = null) => {
    setEditingDepartment(department);
    setShowModal(true);
  };

  const saveDepartment = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = { name: data.get('name'), lead: data.get('lead'), activeLabs: Number(data.get('activeLabs')) };
    try {
      const response = await fetch(`${API_BASE_URL}/api/departments${editingDepartment ? `/${editingDepartment.id}` : ''}`, {
        method: editingDepartment ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Department could not be saved.');
      setDepartments((current) => editingDepartment ? current.map((item) => item.id === editingDepartment.id ? result : item) : [result, ...current]);
      setShowModal(false);
      setEditingDepartment(null);
      setMessage(`${result.name} was ${editingDepartment ? 'updated' : 'created'} successfully.`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const deactivateDepartment = async (department) => {
    if (!window.confirm(`Deactivate ${department.name}? It will be marked inactive.`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/departments/${department.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Department could not be deactivated.');
      setDepartments((current) => current.map((item) => item.id === department.id ? (result.department || { ...item, status: 'Inactive' }) : item));
      setMessage(`${department.name} was deactivated.`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Department Management</h1>
          <p className="mt-1 text-xs font-medium text-slate-500">Manage academic departments, lab counts, asset allocation, and department leads.</p>
        </div>
        {isAdmin && <button onClick={() => openModal()} className="inline-flex items-center gap-2 rounded-md bg-[#1f5ff0] px-4 py-2.5 text-xs font-bold text-white shadow-sm">
          <Plus size={15} />
          Add Department
        </button>}
      </div>

      {message && <p role="status" className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-800">{message}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric title="Departments" value={departments.length} icon={Building2} />
        <Metric title="Total Users" value={departments.reduce((sum, item) => sum + item.users, 0)} icon={UserRound} />
        <Metric title="Equipment" value={departments.reduce((sum, item) => sum + item.equipment, 0)} icon={FlaskConical} />
        <Metric title="Active Labs" value={departments.reduce((sum, item) => sum + item.activeLabs, 0)} icon={Building2} />
      </div>

      <section className="rounded-lg border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-sm font-bold text-slate-900">Departments</h2>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search departments..."
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#1f5ff0] focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
          {filteredDepartments.map((department) => (
            <article key={department.id} className="rounded-lg border border-slate-100 p-4 transition hover:border-blue-100 hover:bg-blue-50/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-md bg-blue-50 text-[#1f5ff0]">
                    <Building2 size={20} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{department.name}</h3>
                    <p className="mt-1 text-xs font-medium text-slate-500">Lead: {department.lead}</p>
                  </div>
                </div>
                <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${department.status === 'Inactive' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{department.status}</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <MiniStat label="Users" value={department.users} />
                <MiniStat label="Equipment" value={department.equipment} />
                <MiniStat label="Labs" value={department.activeLabs} />
              </div>
              {isAdmin && (
                <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
                  <button onClick={() => openModal(department)} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-blue-100 hover:bg-blue-50 hover:text-[#1f5ff0]">
                    <Edit2 size={13} /> Edit
                  </button>
                  <button onClick={() => deactivateDepartment(department)} disabled={department.status === 'Inactive'} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-red-500 transition hover:border-red-100 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-35">
                    <UserX size={13} /> Deactivate
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <form onSubmit={saveDepartment} className="w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">{editingDepartment ? 'Edit Department' : 'Add Department'}</h2>
                <p className="text-xs text-slate-500">{editingDepartment ? 'Update department details.' : 'Create a department summary for admin tracking.'}</p>
              </div>
              <button type="button" onClick={() => { setShowModal(false); setEditingDepartment(null); }} className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Input name="name" label="Department Name" defaultValue={editingDepartment?.name} required />
              <Input name="lead" label="Department Lead" defaultValue={editingDepartment?.lead} required />
              <Input name="activeLabs" label="Active Labs" type="number" min="0" defaultValue={editingDepartment?.activeLabs ?? 0} required />
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4">
              <button type="button" onClick={() => { setShowModal(false); setEditingDepartment(null); }} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600">Cancel</button>
              <button className="rounded-md bg-[#1f5ff0] px-4 py-2 text-xs font-bold text-white">{editingDepartment ? 'Save Changes' : 'Save Department'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const Metric = ({ title, value, icon: Icon }) => (
  <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{title}</p>
        <h3 className="mt-1 text-2xl font-bold text-slate-900">{value}</h3>
      </div>
      <span className="grid h-10 w-10 place-items-center rounded-md bg-blue-50 text-[#1f5ff0]">
        <Icon size={18} />
      </span>
    </div>
  </div>
);

const MiniStat = ({ label, value }) => (
  <div className="rounded-md bg-slate-50 p-3">
    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
  </div>
);

const Input = ({ label, ...props }) => (
  <label className="space-y-1.5">
    <span className="block text-xs font-bold text-slate-600">{label}</span>
    <input {...props} className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#1f5ff0]" />
  </label>
);

export default Departments;

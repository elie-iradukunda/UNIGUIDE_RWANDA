import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  Download,
  Edit2,
  Eye,
  FilePlus2,
  Filter,
  Package,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { departments, equipmentItems } from '../data/demoData';
import API_BASE_URL from '../config/api';

const Equipment = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState(equipmentItems);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [department, setDepartment] = useState('All Departments');
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const isAdmin = localStorage.getItem('userRole') === 'Admin';

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/api/equipment`)
      .then((response) => {
        if (!response.ok) throw new Error('Equipment could not be loaded.');
        return response.json();
      })
      .then((data) => active && setItems(data.equipment || data))
      .catch(() => active && setMessage('Live inventory is temporarily unavailable; verified demonstration data is shown.'));
    return () => { active = false; };
  }, []);

  const categories = useMemo(() => ['All Categories', ...new Set(items.map((item) => item.category))], [items]);
  const departmentOptions = useMemo(() => ['All Departments', ...departments.map((item) => item.name)], []);

  const filteredItems = useMemo(() => {
    const term = search.toLowerCase();
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(term) || item.assetTag.toLowerCase().includes(term) || item.category.toLowerCase().includes(term);
      const matchesCategory = category === 'All Categories' || item.category === category;
      const matchesDepartment = department === 'All Departments' || item.department === department;
      return matchesSearch && matchesCategory && matchesDepartment;
    });
  }, [items, search, category, department]);

  const handleExport = () => {
    const headers = ['Asset Tag', 'Name', 'Category', 'Department', 'Location', 'Available', 'Stock', 'Status'];
    const rows = filteredItems.map((item) => [item.assetTag, item.name, item.category, item.department, item.location, item.available, item.stock, item.status]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'uniguide-equipment.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const openModal = (item = null) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const saveEquipment = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const stock = Number(data.get('stock'));
    const payload = editingItem
      ? {
          name: data.get('name'), assetTag: data.get('assetTag'), category: data.get('category'),
          department: data.get('department'), location: data.get('location'), status: data.get('status'),
          stock, available: Math.min(Number(data.get('available')), stock),
        }
      : {
          name: data.get('name'), assetTag: data.get('assetTag'), category: data.get('category'),
          department: data.get('department'), location: data.get('location'), status: 'Available',
          stock, available: stock,
          modelNumber: 'New Asset', serialNumber: `RW-${Date.now()}`,
          description: 'Newly registered laboratory equipment.', image: '',
        };
    try {
      const response = await fetch(`${API_BASE_URL}/api/equipment${editingItem ? `/${editingItem.id}` : ''}`, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Equipment could not be saved.');
      setItems((current) => editingItem ? current.map((record) => record.id === editingItem.id ? result : record) : [result, ...current]);
      setShowModal(false);
      setEditingItem(null);
      setMessage(`${result.name} was ${editingItem ? 'updated' : 'registered'} successfully.`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const registerMaintenance = async (item) => {
    if (!window.confirm(`Mark ${item.name} as under maintenance?`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/equipment/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ status: 'Maintenance', requiresMaintenance: true }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Maintenance status could not be saved.');
      setItems((current) => current.map((record) => record.id === item.id ? result : record));
      setMessage(`${item.name} is now marked for maintenance.`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const deleteEquipment = async (item) => {
    if (!window.confirm(`Permanently delete ${item.name}? This cannot be undone.`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/equipment/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Equipment could not be deleted.');
      setItems((current) => current.filter((record) => record.id !== item.id));
      setMessage(`${item.name} was deleted.`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Equipment Management</h1>
          <p className="mt-1 text-xs font-medium text-slate-500">Manage inventory, lab location, availability, and equipment details.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExport} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50">
            <Download size={15} />
            Export
          </button>
          <button onClick={() => openModal()} className="inline-flex items-center gap-2 rounded-md bg-[#1f5ff0] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700">
            <Plus size={15} />
            Add Equipment
          </button>
        </div>
      </div>

      {message && <p role="status" className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-800">{message}</p>}

      <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, ID, or category..."
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#1f5ff0] focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <SelectFilter icon={Filter} value={category} onChange={setCategory} options={categories} />
          <SelectFilter icon={ChevronDown} value={department} onChange={setDepartment} options={departmentOptions} />
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-bold">Asset Details</th>
                <th className="px-5 py-3 font-bold">Category</th>
                <th className="px-5 py-3 font-bold">Department</th>
                <th className="px-5 py-3 font-bold">Stock</th>
                <th className="px-5 py-3 font-bold">Status</th>
                <th className="px-5 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr key={item.id} onClick={() => navigate(`/equipment/${item.id}`)} className="cursor-pointer transition hover:bg-slate-50/80">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                        {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : <Package size={22} className="text-slate-400" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-bold text-slate-900">{item.name}</span>
                        <span className="mt-0.5 block text-xs font-medium text-slate-400">{item.assetTag} · {item.modelNumber}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{item.category}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{item.department}</td>
                  <td className="px-5 py-4">
                    <div className="w-24">
                      <div className="mb-1 flex justify-between text-xs font-semibold text-slate-700">
                        <span>{item.available}</span>
                        <span className="text-slate-400">/ {item.stock}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className={item.available > 0 ? 'h-full rounded-full bg-emerald-500' : 'h-full rounded-full bg-red-500'} style={{ width: `${Math.max(4, (item.available / item.stock) * 100)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link onClick={(event) => event.stopPropagation()} to={`/equipment/${item.id}`} className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-slate-500 transition hover:border-blue-100 hover:bg-blue-50 hover:text-[#1f5ff0]" title="View details">
                        <Eye size={15} />
                      </Link>
                      <button onClick={(event) => { event.stopPropagation(); registerMaintenance(item); }} className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-slate-500 transition hover:border-blue-100 hover:bg-blue-50 hover:text-[#1f5ff0]" title="Register maintenance">
                        <FilePlus2 size={15} />
                      </button>
                      <button onClick={(event) => { event.stopPropagation(); openModal(item); }} className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-slate-500 transition hover:border-blue-100 hover:bg-blue-50 hover:text-[#1f5ff0]" title="Edit equipment">
                        <Edit2 size={15} />
                      </button>
                      {isAdmin && (
                        <button onClick={(event) => { event.stopPropagation(); deleteEquipment(item); }} className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-red-500 transition hover:border-red-100 hover:bg-red-50" title="Delete equipment">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className="py-16 text-center">
            <Package className="mx-auto mb-3 text-slate-200" size={42} />
            <p className="text-sm font-semibold text-slate-400">No equipment matches your filters.</p>
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <form onSubmit={saveEquipment} className="w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">{editingItem ? 'Edit Equipment' : 'Add Equipment'}</h2>
                <p className="text-xs text-slate-500">{editingItem ? 'Update this lab asset\'s details.' : 'Register a new lab asset for tracking.'}</p>
              </div>
              <button type="button" onClick={() => { setShowModal(false); setEditingItem(null); }} className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Input name="name" label="Equipment Name" placeholder="e.g. Function Generator" defaultValue={editingItem?.name} required />
              <Input name="assetTag" label="Asset Tag" placeholder="FG-006" defaultValue={editingItem?.assetTag} required />
              <Input name="category" label="Category" placeholder="Electronics" defaultValue={editingItem?.category} required />
              <Input name="department" label="Department" placeholder="Mechatronics" defaultValue={editingItem?.department} required />
              <Input name="location" label="Location" placeholder="Electronics Lab 2" defaultValue={editingItem?.location} required />
              <Input name="stock" label="Stock" type="number" min="1" defaultValue={editingItem?.stock ?? 1} required />
              {editingItem && <Input name="available" label="Available" type="number" min="0" defaultValue={editingItem?.available ?? 0} required />}
              {editingItem && (
                <label className="space-y-1.5">
                  <span className="block text-xs font-bold text-slate-600">Status</span>
                  <select name="status" defaultValue={editingItem?.status || 'Available'} className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#1f5ff0]">
                    <option>Available</option>
                    <option>In Use</option>
                    <option>Maintenance</option>
                  </select>
                </label>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4">
              <button type="button" onClick={() => { setShowModal(false); setEditingItem(null); }} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600">
                Cancel
              </button>
              <button className="rounded-md bg-[#1f5ff0] px-4 py-2 text-xs font-bold text-white">
                {editingItem ? 'Save Changes' : 'Save Equipment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const SelectFilter = ({ icon: Icon, value, onChange, options }) => (
  <label className="relative block">
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-full w-full appearance-none rounded-md border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-sm font-semibold text-slate-600 outline-none transition hover:bg-slate-50 focus:border-[#1f5ff0]"
    >
      {options.map((option) => <option key={option}>{option}</option>)}
    </select>
    <Icon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
  </label>
);

const Input = ({ label, ...props }) => (
  <label className="space-y-1.5">
    <span className="block text-xs font-bold text-slate-600">{label}</span>
    <input {...props} className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#1f5ff0] focus:bg-white focus:ring-2 focus:ring-blue-100" />
  </label>
);

const StatusBadge = ({ status }) => {
  const styles = {
    Available: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'In Use': 'bg-amber-50 text-amber-700 border-amber-100',
    Maintenance: 'bg-red-50 text-red-700 border-red-100',
  };
  return <span className={`rounded-md border px-2.5 py-1 text-xs font-bold ${styles[status] || styles.Available}`}>{status}</span>;
};

export default Equipment;

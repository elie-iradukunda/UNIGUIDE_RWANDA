import { useEffect, useMemo, useState } from 'react';
import { Edit2, Mail, Plus, Search, Shield, UserMinus, Users as UsersIcon, X } from 'lucide-react';
import { users as demoUsers } from '../data/demoData';
import API_BASE_URL from '../config/api';

const Users = () => {
  const [users, setUsers] = useState(demoUsers);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('All Roles');
  const [editingUser, setEditingUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionDialog, setActionDialog] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [permissionForm, setPermissionForm] = useState({ canBorrow: false, canReserve: false, canViewReports: false });
  const [message, setMessage] = useState('');

  const roles = ['All Roles', 'Student', 'HOD', 'Lab Staff', 'Admin'];
  const departmentOptions = ['Renewable Energy', 'Mechatronic', 'ICT', 'Electronic and Telecommunication'];

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/api/users`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then((response) => {
        if (!response.ok) throw new Error('Users could not be loaded.');
        return response.json();
      })
      .then((data) => active && setUsers(data))
      .catch(() => active && setMessage('Live user records are temporarily unavailable; demonstration records are shown.'));
    return () => { active = false; };
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase();
    return users.filter((user) => {
      const matchesSearch = user.fullName.toLowerCase().includes(term) || user.email.toLowerCase().includes(term) || String(user.studentId || '').toLowerCase().includes(term);
      const matchesRole = role === 'All Roles' || user.role === role;
      return matchesSearch && matchesRole;
    });
  }, [users, search, role]);

  const openModal = (user = null) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const openActionDialog = (type, user) => {
    setActionDialog({ type, user });
    setPermissionForm({
      canBorrow: user.canBorrow !== false,
      canReserve: user.canReserve !== false,
      canViewReports: Boolean(user.canViewReports),
    });
  };

  const closeActionDialog = () => {
    setActionDialog(null);
    setActionBusy(false);
  };

  const saveUser = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      fullName: data.get('fullName'),
      email: data.get('email'),
      role: data.get('role'),
      department: data.get('department'),
      studentId: data.get('studentId'),
      status: data.get('status'),
      password: data.get('password') || undefined,
    };
    try {
      const response = await fetch(`${API_BASE_URL}/api/users${editingUser ? `/${editingUser.id}` : ''}`, {
        method: editingUser ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'User could not be saved.');
      setUsers((current) => editingUser ? current.map((user) => user.id === editingUser.id ? result : user) : [result, ...current]);
      setShowModal(false);
      setEditingUser(null);
      setMessage(`${result.fullName}'s account was saved.`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const savePermissions = async () => {
    if (!actionDialog?.user) return;
    setActionBusy(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${actionDialog.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(permissionForm),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Permissions could not be saved.');
      setUsers((current) => current.map((user) => user.id === result.id ? result : user));
      setMessage(`${result.fullName}'s permissions were updated.`);
      closeActionDialog();
    } catch (error) {
      setMessage(error.message);
      setActionBusy(false);
    }
  };

  const deactivateUser = async () => {
    if (!actionDialog?.user) return;
    setActionBusy(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${actionDialog.user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Account could not be deactivated.');
      const updatedUser = result.user || result;
      setUsers((current) => current.map((user) => user.id === updatedUser.id ? updatedUser : user));
      setMessage(`${updatedUser.fullName}'s account is inactive.`);
      closeActionDialog();
    } catch (error) {
      setMessage(error.message);
      setActionBusy(false);
    }
  };

  const openEmailClient = () => {
    if (!actionDialog?.user) return;
    const subject = encodeURIComponent('UniGuide Rwanda account support');
    window.location.href = `mailto:${actionDialog.user.email}?subject=${subject}`;
    setMessage(`Email draft opened for ${actionDialog.user.email}.`);
    closeActionDialog();
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">User Management</h1>
          <p className="mt-1 text-xs font-medium text-slate-500">Manage system access, departments, roles, and account status.</p>
        </div>
        <button onClick={() => openModal()} className="inline-flex items-center gap-2 rounded-md bg-[#1f5ff0] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700">
          <Plus size={15} />
          Add User
        </button>
      </div>

      {message && <p role="status" className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-800">{message}</p>}

      <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users..."
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#1f5ff0] focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <select value={role} onChange={(event) => setRole(event.target.value)} className="rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 outline-none focus:border-[#1f5ff0]">
            {roles.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-bold">User</th>
                <th className="px-5 py-3 font-bold">Role</th>
                <th className="px-5 py-3 font-bold">Department</th>
                <th className="px-5 py-3 font-bold">Status</th>
                <th className="px-5 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="transition hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=1f5ff0&color=fff`} alt="" className="h-10 w-10 rounded-full border border-slate-200" />
                      <div>
                        <p className="font-bold text-slate-900">{user.fullName}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4"><RoleBadge role={user.role} /></td>
                  <td className="px-5 py-4 text-slate-600">{user.department}</td>
                  <td className="px-5 py-4"><StatusBadge status={user.status} /></td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <IconButton title="Edit User" onClick={() => openModal(user)} icon={Edit2} />
                      <IconButton title="Email User" icon={Mail} onClick={() => openActionDialog('email', user)} />
                      <IconButton title="Review Permissions" icon={Shield} onClick={() => openActionDialog('permissions', user)} />
                      <IconButton title="Deactivate User" icon={UserMinus} onClick={() => openActionDialog('deactivate', user)} danger disabled={user.status === 'Inactive'} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="py-16 text-center">
            <UsersIcon className="mx-auto mb-3 text-slate-200" size={42} />
            <p className="text-sm font-semibold text-slate-400">No users match your filters.</p>
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <form onSubmit={saveUser} className="w-full max-w-xl overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">{editingUser ? 'Edit User' : 'Add User'}</h2>
                <p className="text-xs text-slate-500">Keep roles and account details up to date.</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Input name="fullName" label="Full Name" defaultValue={editingUser?.fullName} required />
              <Input name="email" label="Email" type="email" defaultValue={editingUser?.email} required />
              {!editingUser && <Input name="password" label="Temporary Password" type="password" defaultValue="ChangeMe123" minLength="8" required />}
              <Input name="studentId" label="Student/Staff ID" defaultValue={editingUser?.studentId} required />
              <Select name="department" label="Department" defaultValue={editingUser?.department || departmentOptions[0]} options={departmentOptions} />
              <Select name="role" label="Role" defaultValue={editingUser?.role || 'Student'} options={roles.filter((item) => item !== 'All Roles')} />
              <Select name="status" label="Status" defaultValue={editingUser?.status || 'Active'} options={['Active', 'Inactive']} />
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4">
              <button type="button" onClick={() => setShowModal(false)} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600">Cancel</button>
              <button className="rounded-md bg-[#1f5ff0] px-4 py-2 text-xs font-bold text-white">Save User</button>
            </div>
          </form>
        </div>
      )}

      {actionDialog && (
        <ActionDialog
          dialog={actionDialog}
          permissionForm={permissionForm}
          onPermissionChange={(key) => setPermissionForm((current) => ({ ...current, [key]: !current[key] }))}
          onClose={closeActionDialog}
          onEmail={openEmailClient}
          onDeactivate={deactivateUser}
          onSavePermissions={savePermissions}
          busy={actionBusy}
        />
      )}
    </div>
  );
};

const IconButton = ({ icon: Icon, title, onClick, danger = false, disabled = false }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    disabled={disabled}
    className={`grid h-8 w-8 place-items-center rounded-md border border-slate-200 transition disabled:cursor-not-allowed disabled:opacity-35 ${danger ? 'text-red-500 hover:border-red-100 hover:bg-red-50' : 'text-slate-500 hover:border-blue-100 hover:bg-blue-50 hover:text-[#1f5ff0]'}`}
  >
    <Icon size={15} />
  </button>
);

const ActionDialog = ({ dialog, permissionForm, onPermissionChange, onClose, onEmail, onDeactivate, onSavePermissions, busy }) => {
  const user = dialog.user;
  const isEmail = dialog.type === 'email';
  const isPermissions = dialog.type === 'permissions';
  const isDeactivate = dialog.type === 'deactivate';

  const title = isEmail ? 'Email User' : isPermissions ? 'Review Permissions' : 'Deactivate User';
  const description = isEmail
    ? 'This will open your email app with this user as the recipient. Nothing is sent until you write and send the message.'
    : isPermissions
      ? 'Review what this account can do before saving changes.'
      : 'This will make the account inactive and stop the user from signing in. You can reactivate the account later from Edit User.';

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <section className="w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="user-action-title">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="user-action-title" className="text-base font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-900">{user.fullName}</p>
            <p className="mt-1 text-xs text-slate-500">{user.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <RoleBadge role={user.role} />
              <StatusBadge status={user.status} />
            </div>
          </div>

          {isEmail && (
            <div className="rounded-md border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
              Recipient: <span className="font-bold">{user.email}</span>
            </div>
          )}

          {isPermissions && (
            <div className="space-y-3">
              <PermissionToggle
                label="Allow borrowing equipment"
                description="Student can submit equipment borrow requests."
                checked={permissionForm.canBorrow}
                onChange={() => onPermissionChange('canBorrow')}
              />
              <PermissionToggle
                label="Can make lab reservations"
                description="Account can create reservation records where the role allows it."
                checked={permissionForm.canReserve}
                onChange={() => onPermissionChange('canReserve')}
              />
              <PermissionToggle
                label="View system reports"
                description="Account can access reporting data when its role has report access."
                checked={permissionForm.canViewReports}
                onChange={() => onPermissionChange('canViewReports')}
              />
            </div>
          )}

          {isDeactivate && (
            <div className="rounded-md border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700">
              Confirm only if you want to block this user from logging in. This action does not erase their historical requests.
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-50">
            Cancel
          </button>
          {isEmail && (
            <button type="button" onClick={onEmail} disabled={busy} className="rounded-md bg-[#1f5ff0] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
              Open Email Draft
            </button>
          )}
          {isPermissions && (
            <button type="button" onClick={onSavePermissions} disabled={busy} className="rounded-md bg-[#1f5ff0] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
              {busy ? 'Saving...' : 'Save Permissions'}
            </button>
          )}
          {isDeactivate && (
            <button type="button" onClick={onDeactivate} disabled={busy} className="rounded-md bg-red-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
              {busy ? 'Deactivating...' : 'Deactivate Account'}
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

const PermissionToggle = ({ label, description, checked, onChange }) => (
  <label className="flex cursor-pointer items-start justify-between gap-4 rounded-md border border-slate-100 bg-white p-4 transition hover:border-blue-100">
    <span>
      <span className="block text-sm font-bold text-slate-900">{label}</span>
      <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
    </span>
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-[#1f5ff0] focus:ring-[#1f5ff0]/20"
    />
  </label>
);

const Input = ({ label, ...props }) => (
  <label className="space-y-1.5">
    <span className="block text-xs font-bold text-slate-600">{label}</span>
    <input {...props} className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#1f5ff0] focus:bg-white focus:ring-2 focus:ring-blue-100" />
  </label>
);

const Select = ({ label, options, ...props }) => (
  <label className="space-y-1.5">
    <span className="block text-xs font-bold text-slate-600">{label}</span>
    <select {...props} className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#1f5ff0] focus:bg-white focus:ring-2 focus:ring-blue-100">
      {options.map((option) => <option key={option}>{option}</option>)}
    </select>
  </label>
);

const RoleBadge = ({ role }) => {
  const styles = {
    Admin: 'bg-violet-50 text-violet-700',
    HOD: 'bg-amber-50 text-amber-700',
    'Lab Staff': 'bg-emerald-50 text-emerald-700',
    Student: 'bg-blue-50 text-blue-700',
  };
  return <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${styles[role] || 'bg-slate-100 text-slate-700'}`}>{role}</span>;
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold ${status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
    {status}
  </span>
);

export default Users;

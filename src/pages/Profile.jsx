import { useEffect, useState } from 'react';
import { BadgeCheck, Bell, Briefcase, Eye, Mail, Save, Shield, Type, User } from 'lucide-react';
import { users } from '../data/demoData';
import API_BASE_URL from '../config/api';

const Profile = () => {
  const [profile, setProfile] = useState(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      return storedUser ? { ...users[0], ...storedUser } : users[0];
    } catch {
      return users[0];
    }
  });
  const [draft, setDraft] = useState(() => ({ fullName: profile.fullName, email: profile.email }));
  const [message, setMessage] = useState('');
  const [preferences, setPreferences] = useState(() => {
    try { return JSON.parse(localStorage.getItem('accessibilityPreferences')) || {}; } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem('accessibilityPreferences', JSON.stringify(preferences));
    document.documentElement.dataset.textSize = preferences.largeText ? 'large' : 'normal';
    document.documentElement.dataset.contrast = preferences.highContrast ? 'high' : 'normal';
  }, [preferences]);

  const saveProfile = async () => {
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(draft),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Profile could not be saved.');
      setProfile(result);
      localStorage.setItem('user', JSON.stringify(result));
      setMessage('Profile saved successfully.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My Profile</h1>
        <p className="mt-1 text-xs font-medium text-slate-500">Review your UniGuide Rwanda account, department, and notification preferences.</p>
      </div>

      <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=1f5ff0&color=fff`} alt="" className="h-20 w-20 rounded-full border-4 border-slate-100" />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-slate-900">{profile.fullName}</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">{profile.role} · {profile.department}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
              <BadgeCheck size={14} />
              Verified Account
            </span>
          </div>
          <button type="button" onClick={saveProfile} className="inline-flex items-center gap-2 rounded-md bg-[#1f5ff0] px-4 py-2.5 text-xs font-bold text-white shadow-sm">
            <Save size={15} />
            Save Changes
          </button>
        </div>
      </section>

      {message && <p role="status" className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-800">{message}</p>}

      <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm" aria-labelledby="accessibility-title">
        <h3 id="accessibility-title" className="text-sm font-bold text-slate-900">Accessibility Preferences</h3>
        <p className="mt-1 text-xs text-slate-500">These preferences are stored on this device and applied throughout UniGuide.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <PreferenceButton
            icon={Type}
            title="Larger text"
            description="Increase interface text for easier reading."
            active={Boolean(preferences.largeText)}
            onClick={() => setPreferences((current) => ({ ...current, largeText: !current.largeText }))}
          />
          <PreferenceButton
            icon={Eye}
            title="Higher contrast"
            description="Strengthen contrast between text and backgrounds."
            active={Boolean(preferences.highContrast)}
            onClick={() => setPreferences((current) => ({ ...current, highContrast: !current.highContrast }))}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Account Details</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Input label="Display Name" value={draft.fullName} onChange={(event) => setDraft((current) => ({ ...current, fullName: event.target.value }))} icon={User} />
            <Input label="Email Address" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} icon={Mail} />
            <Input label="Role" defaultValue={profile.role} icon={Shield} disabled />
            <Input label="Student/Staff ID" defaultValue={profile.studentId} icon={Briefcase} disabled />
            <Input label="Department" defaultValue={profile.department} icon={Briefcase} disabled />
          </div>
        </div>

        <aside className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Notification Summary</h3>
          <div className="mt-4 space-y-3">
            {[
              ['Borrow approvals', 'Enabled'],
              ['Return reminders', 'Enabled'],
              ['Lab announcements', 'Enabled'],
              ['Maintenance alerts', 'Staff only'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-3">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-700"><Bell size={14} className="text-[#1f5ff0]" /> {label}</span>
                <span className="text-[11px] font-bold text-slate-400">{value}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
};

const Input = ({ label, icon: Icon, disabled = false, ...props }) => (
  <label className="space-y-1.5">
    <span className="block text-xs font-bold text-slate-600">{label}</span>
    <span className="relative block">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />}
      <input
        {...props}
        disabled={disabled}
        className={`w-full rounded-md border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#1f5ff0] focus:bg-white focus:ring-2 focus:ring-blue-100 ${disabled ? 'bg-slate-50 text-slate-400' : 'bg-white text-slate-800'}`}
      />
    </span>
  </label>
);

const PreferenceButton = ({ icon: Icon, title, description, active, onClick }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={`flex items-center gap-3 rounded-lg border p-4 text-left transition ${active ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:bg-white'}`}
  >
    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${active ? 'bg-[#1f5ff0] text-white' : 'bg-white text-slate-500'}`}><Icon size={18} /></span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-bold text-slate-900">{title}</span>
      <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
    </span>
    <span className="text-xs font-bold text-slate-500">{active ? 'On' : 'Off'}</span>
  </button>
);

export default Profile;

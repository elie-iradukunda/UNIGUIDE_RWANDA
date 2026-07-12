import { Bell, Lock, Monitor, Save, Shield, ToggleLeft, ToggleRight, User } from 'lucide-react';
import { useState } from 'react';

const defaultSettings = {
  institutionName: 'UniGuide Rwanda',
  primaryDepartment: 'ICT Department',
  borrowDuration: '3 days',
  supportEmail: 'admin@uniguide.rw',
  emailNotifications: true,
  smsAlerts: false,
  twoFactorAuthentication: true,
  compactDashboard: true,
};

const Settings = () => {
  const [settings, setSettings] = useState(() => {
    try { return { ...defaultSettings, ...JSON.parse(localStorage.getItem('uniguideSettings') || '{}') }; } catch { return defaultSettings; }
  });
  const [message, setMessage] = useState('');
  const [activeSection, setActiveSection] = useState('general');
  const setValue = (key, value) => setSettings((current) => ({ ...current, [key]: value }));
  const saveSettings = () => {
    localStorage.setItem('uniguideSettings', JSON.stringify(settings));
    setMessage('System preferences were saved on this administration device.');
  };
  const sections = [
    { id: 'general', icon: User, label: 'General' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'security', icon: Shield, label: 'Security' },
    { id: 'appearance', icon: Monitor, label: 'Appearance' },
  ];

  return (
  <div className="space-y-6 pb-8">
    <div>
      <h1 className="text-xl font-bold text-slate-900">System Settings</h1>
      <p className="mt-1 text-xs font-medium text-slate-500">Configure notifications, security, display preferences, and system defaults.</p>
    </div>

    {message && <p role="status" className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-800">{message}</p>}

    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-lg border border-slate-100 bg-white p-2 shadow-sm">
        {sections.map((section) => (
          <NavItem
            key={section.id}
            icon={section.icon}
            label={section.label}
            active={activeSection === section.id}
            onClick={() => setActiveSection(section.id)}
          />
        ))}
      </aside>

      <main className="space-y-5">
        {activeSection === 'general' && (
          <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900">Platform Defaults</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Input label="Institution Name" value={settings.institutionName} onChange={(event) => setValue('institutionName', event.target.value)} />
              <Input label="Primary Department" value={settings.primaryDepartment} onChange={(event) => setValue('primaryDepartment', event.target.value)} />
              <Input label="Default Borrow Duration" value={settings.borrowDuration} onChange={(event) => setValue('borrowDuration', event.target.value)} />
              <Input label="Support Email" value={settings.supportEmail} onChange={(event) => setValue('supportEmail', event.target.value)} />
            </div>
            <SaveRow onSave={saveSettings} />
          </section>
        )}

        {activeSection === 'notifications' && (
          <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900">Notification Preferences</h2>
            <div className="mt-4 divide-y divide-slate-100">
              <ToggleRow label="Email Notifications" description="Receive updates about reservations and approvals." checked={settings.emailNotifications} onToggle={() => setValue('emailNotifications', !settings.emailNotifications)} />
              <ToggleRow label="SMS Alerts" description="Send text messages for overdue items and urgent announcements." checked={settings.smsAlerts} onToggle={() => setValue('smsAlerts', !settings.smsAlerts)} />
            </div>
            <SaveRow onSave={saveSettings} />
          </section>
        )}

        {activeSection === 'security' && (
          <>
            <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900">Security Preferences</h2>
              <div className="mt-4 divide-y divide-slate-100">
                <ToggleRow label="Two-Factor Authentication" description="Require an extra verification step for staff accounts." checked={settings.twoFactorAuthentication} onToggle={() => setValue('twoFactorAuthentication', !settings.twoFactorAuthentication)} />
              </div>
              <SaveRow onSave={saveSettings} />
            </section>

            <section className="rounded-lg border border-red-100 bg-red-50 p-5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-bold text-red-700"><Lock size={16} /> Restricted Setting</h2>
                  <p className="mt-1 text-xs text-red-600/80">Critical role and data retention settings should be changed by the system administrator only.</p>
                </div>
                <button type="button" onClick={() => setMessage('Critical security and retention changes require institutional approval.')} className="rounded-md border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100">
                  Request Access
                </button>
              </div>
            </section>
          </>
        )}

        {activeSection === 'appearance' && (
          <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900">Appearance Preferences</h2>
            <div className="mt-4 divide-y divide-slate-100">
              <ToggleRow label="Compact Dashboard Density" description="Use smaller spacing for high-volume management tables." checked={settings.compactDashboard} onToggle={() => setValue('compactDashboard', !settings.compactDashboard)} />
            </div>
            <SaveRow onSave={saveSettings} />
          </section>
        )}
      </main>
    </div>
  </div>
  );
};

const NavItem = ({ icon: Icon, label, active = false, onClick }) => (
  <button type="button" onClick={onClick} className={`mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-bold transition ${active ? 'bg-blue-50 text-[#1f5ff0]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
    <Icon size={17} />
    {label}
  </button>
);

const Input = ({ label, ...props }) => (
  <label className="space-y-1.5">
    <span className="block text-xs font-bold text-slate-600">{label}</span>
    <input {...props} className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#1f5ff0] focus:bg-white focus:ring-2 focus:ring-blue-100" />
  </label>
);

const ToggleRow = ({ label, description, checked, onToggle }) => (
  <div className="flex items-center justify-between gap-5 py-4">
    <div>
      <p className="text-sm font-bold text-slate-900">{label}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </div>
    <button type="button" onClick={onToggle} className={checked ? 'text-[#1f5ff0]' : 'text-slate-300'} aria-label={label} aria-pressed={checked}>
      {checked ? <ToggleRight size={30} /> : <ToggleLeft size={30} />}
    </button>
  </div>
);

const SaveRow = ({ onSave }) => (
  <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
    <button type="button" onClick={onSave} className="inline-flex items-center gap-2 rounded-md bg-[#1f5ff0] px-4 py-2.5 text-xs font-bold text-white shadow-sm">
      <Save size={15} />
      Save Changes
    </button>
  </div>
);

export default Settings;

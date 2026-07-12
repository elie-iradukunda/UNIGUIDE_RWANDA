import { useEffect, useState } from 'react';
import {
  Bell,
  BookOpen,
  BarChart3,
  CheckCircle,
  ClipboardList,
  Clock,
  FilePlus2,
  LayoutDashboard,
  MapPinned,
  Megaphone,
  Package,
  QrCode,
  Settings,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import { handleImageError } from '../utils/imageFallback';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const getJson = (path) =>
  fetch(`${API_BASE_URL}${path}`, { headers: authHeaders() })
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))));

/**
 * The dashboard used to render fixtures from src/data/demoData, so a brand-new
 * student saw three borrow requests they had never made. Everything here now comes
 * from the signed-in account's own records.
 */
const useApiList = (path) => {
  const [items, setItems] = useState([]);
  useEffect(() => {
    if (!path) return undefined;
    let active = true;
    getJson(path)
      .then((data) => {
        if (!active) return;
        setItems(Array.isArray(data) ? data : data.reservations || data.announcements || []);
      })
      .catch(() => active && setItems([]));
    return () => { active = false; };
  }, [path]);
  return items;
};

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const statusStyles = {
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Pending: 'bg-amber-50 text-amber-700 border-amber-100',
  Completed: 'bg-slate-100 text-slate-600 border-slate-200',
  Returned: 'bg-slate-100 text-slate-600 border-slate-200',
  Borrowed: 'bg-blue-50 text-blue-700 border-blue-100',
};

const Dashboard = () => {
  const [userRole] = useState(() => localStorage.getItem('userRole') || 'Student');
  const [stats, setStats] = useState({ totalEquipment: 0, totalUsers: 0, pendingReservations: 0, activeLoans: 0, availableEquipment: 0 });

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/api/dashboard/stats`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => { if (active) setStats((current) => ({ ...current, ...data })); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const isAdmin = userRole === 'Admin';
  const isBorrower = userRole === 'Student';
  const isOperations = ['Lab Staff', 'HOD'].includes(userRole);

  // A student is told how many of their own requests are still waiting; staff are
  // told how many requests are waiting on them. The badge used to be a constant.
  const myReservations = useApiList(isBorrower ? '/api/reservations/my' : '');
  const pendingCount = isBorrower
    ? myReservations.filter((item) => item.status === 'Pending').length
    : Number(stats.pendingReservations || 0);

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title={getDashboardTitle(userRole)}
        subtitle={getDashboardSubtitle(userRole)}
        count={pendingCount}
      />

      {isBorrower && <StudentDashboard reservations={myReservations} />}
      {isOperations && <StaffDashboard stats={stats} role={userRole} />}
      {isAdmin && <AdminDashboard stats={stats} />}

      <footer className="pt-4 pb-2 text-center text-[11px] text-slate-400">
        © 2026 UniGuide Rwanda. All rights reserved.
      </footer>
    </div>
  );
};

const getDashboardTitle = (role) => {
  if (role === 'Admin') return 'Admin Dashboard';
  if (role === 'Lab Staff') return 'Lab Staff / Technician Dashboard';
  if (role === 'HOD') return 'HOD Dashboard';
  return 'Student Dashboard';
};

const getDashboardSubtitle = (role) => {
  if (role === 'Admin') return 'System Administrator';
  if (role === 'Lab Staff') return 'Department technician equipment and request operations';
  if (role === 'HOD') return 'Department oversight, equipment records, and reports';
  return 'Student laboratory access workspace';
};

const PageHeader = ({ title, subtitle, count }) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="mt-0.5 text-xs font-medium text-slate-500">{subtitle}</p>}
    </div>
    <Link
      to="/notifications"
      className="relative grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:text-[#1f5ff0]"
      aria-label="Notifications"
    >
      <Bell size={19} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-[#f8fafc] bg-red-500 px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  </div>
);

const StudentDashboard = ({ reservations }) => {
  const myRequests = reservations.slice(0, 3);
  const approved = reservations
    .filter((item) => ['Approved', 'Borrowed'].includes(item.status))
    .slice(0, 2);

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_300px]">
      <div className="space-y-5">
        <section className="grid min-h-[154px] grid-cols-1 items-center gap-5 rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:grid-cols-[1fr_auto]">
          <div>
            <h2 className="text-base font-bold text-slate-900">Scan Equipment QR Code</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Scan the QR code on any laboratory equipment to view details, manuals, videos, and borrowing options.
            </p>
            <Link
              to="/scan"
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#1f5ff0] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              <QrCode size={16} />
              Scan Now
            </Link>
          </div>
          <QrCode className="hidden text-[#1f5ff0] md:block" size={82} strokeWidth={1.6} />
        </section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Panel title="My Borrow Requests" link="/my-items">
            <div className="divide-y divide-slate-100">
              {myRequests.map((request) => (
                <RequestRow key={request.id} request={request} compact />
              ))}
              {!myRequests.length && (
                <EmptyState text="You have not requested any equipment yet. Scan a QR code or open the equipment list to make your first request." />
              )}
            </div>
          </Panel>

          <Panel title="My Approved Equipment" link="/approved-equipment">
            <div className="space-y-3">
              {approved.map((request) => (
                <Link
                  to={`/equipment/${request.Equipment?.id}`}
                  key={request.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 transition hover:border-blue-100 hover:bg-blue-50/40"
                >
                  <EquipmentThumb item={request.Equipment} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{request.Equipment?.name} ({request.Equipment?.assetTag})</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={request.status} />
                      {formatDate(request.endDate) && (
                        <span className="text-xs font-medium text-slate-500">Due: {formatDate(request.endDate)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
              {!approved.length && (
                <EmptyState text="Nothing approved yet. Approved equipment will appear here once laboratory staff process your request." />
              )}
            </div>
          </Panel>
        </div>
      </div>

      <AnnouncementsPanel />
    </div>
  );
};

const StaffDashboard = ({ stats, role }) => {
  const reservations = useApiList('/api/reservations/all');
  const announcements = useApiList('/api/announcements');
  const quickActions = [
    { icon: FilePlus2, label: 'Add New Equipment', desc: 'Register department equipment', to: '/equipment', roles: ['Lab Staff', 'HOD'] },
    { icon: ClipboardList, label: 'Borrow Requests', desc: 'Approve, reject, issue, and process returns', to: '/reservations', roles: ['Lab Staff', 'HOD'] },
    { icon: Megaphone, label: 'Manage Announcements', desc: 'Create and publish notices', to: '/announcements', roles: ['Lab Staff', 'HOD'] },
    { icon: BarChart3, label: 'View Reports', desc: 'Borrow and usage reports', to: '/reports', roles: ['HOD'] },
    { icon: MapPinned, label: 'Laboratory Guide', desc: 'Check lab location and accessibility', to: '/lab-guide', roles: ['Lab Staff', 'HOD'] },
  ].filter((action) => action.roles.includes(role));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TopStatCard value={stats.totalEquipment} label="Equipment Records" subLabel="Department assets" icon={BookOpen} className="bg-[#1f5ff0]" />
        <TopStatCard value={stats.pendingReservations} label="Borrow Requests" subLabel="Pending" icon={Clock} className="bg-amber-500" />
        <TopStatCard value={stats.activeLoans} label="Issued Equipment" subLabel="Active loans" icon={CheckCircle} className="bg-emerald-500" />
        <TopStatCard value={announcements.length} label="Announcements" subLabel="Published notices" icon={Megaphone} className="bg-violet-600" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
        <Panel title="Recent Borrow Requests" link="/reservations">
          <div className="divide-y divide-slate-100">
            {reservations.slice(0, 4).map((request) => (
              <RequestRow key={request.id} request={request} showUser />
            ))}
            {!reservations.length && <EmptyState text="No borrow requests in your department yet." />}
          </div>
        </Panel>

        <Panel title="Quick Actions">
          <div className="grid gap-3">
            {quickActions.map((action) => (
              <Link key={action.label} to={action.to} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 transition hover:border-blue-100 hover:bg-blue-50/40">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-blue-50 text-[#1f5ff0]">
                  <action.icon size={18} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-slate-900">{action.label}</span>
                  <span className="block text-[11px] font-medium text-slate-500">{action.desc}</span>
                </span>
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
};

const AdminDashboard = ({ stats }) => {
  const reservations = useApiList('/api/reservations/all');
  const departments = useApiList('/api/departments');

  return (
  <div className="space-y-5">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <TopStatCard value={stats.totalUsers} label="Total Users" subLabel="Active system records" icon={Users} className="bg-[#1f5ff0]" />
      <TopStatCard value={departments.length} label="Departments" subLabel="Active" icon={LayoutDashboard} className="bg-emerald-500" />
      <TopStatCard value={stats.totalEquipment} label="Total Equipment" subLabel="All Departments" icon={Package} className="bg-violet-600" />
      <TopStatCard value={stats.pendingReservations} label="Pending Requests" subLabel="Requires Action" icon={Clock} className="bg-amber-500" />
    </div>

    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[290px_1fr_320px]">
      <Panel title="System Overview">
        <div className="divide-y divide-slate-100">
          {[
            ['Registered users', stats.totalUsers, 'bg-blue-50 text-blue-600'],
            ['Equipment records', stats.totalEquipment, 'bg-red-50 text-red-600'],
            ['Pending requests', stats.pendingReservations, 'bg-amber-50 text-amber-600'],
            ['Active loans', stats.activeLoans, 'bg-emerald-50 text-emerald-600'],
          ].map(([label, count, color]) => (
            <div key={label} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className={`grid h-8 w-8 place-items-center rounded-full ${color}`}>
                  <Users size={15} />
                </span>
                <span className="text-sm font-bold text-slate-800">{label}</span>
              </div>
              <span className="text-sm font-semibold text-slate-600">{count}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Recent Borrow Requests" link="/reservations">
        <div className="divide-y divide-slate-100">
          {reservations.slice(0, 4).map((request) => (
            <RequestRow key={request.id} request={request} showUser />
          ))}
          {!reservations.length && <EmptyState text="No borrow requests have been made yet." />}
        </div>
      </Panel>

      <AnnouncementsPanel compact />
    </div>
  </div>
  );
};

const Panel = ({ title, link, children }) => (
  <section className="rounded-lg border border-slate-100 bg-white shadow-sm">
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      {link && <Link to={link} className="text-xs font-bold text-[#1f5ff0] hover:underline">View all</Link>}
    </div>
    <div className="p-3">{children}</div>
  </section>
);

const TopStatCard = ({ value, label, subLabel, icon: Icon, className }) => (
  <div className={`rounded-lg p-5 text-white shadow-sm ${className}`}>
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold text-white/90">{label}</p>
        <h3 className="mt-2 text-3xl font-bold leading-none">{value}</h3>
        <p className="mt-3 text-xs font-medium text-white/80">{subLabel}</p>
      </div>
      <span className="grid h-11 w-11 place-items-center rounded-lg bg-white/18">
        <Icon size={22} />
      </span>
    </div>
  </div>
);

const RequestRow = ({ request, compact = false, showUser = false }) => {
  const requested = formatDate(request.createdAt || request.startDate);
  return (
    <Link to={`/equipment/${request.Equipment?.id}`} className="flex items-center justify-between gap-3 rounded-md px-2 py-3 transition hover:bg-slate-50">
      <div className="flex min-w-0 items-center gap-3">
        <EquipmentThumb item={request.Equipment} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">
            {request.Equipment?.name} ({request.Equipment?.assetTag})
          </p>
          {showUser && request.User && <p className="mt-0.5 text-xs font-medium text-slate-500">By: {request.User.fullName}</p>}
          {requested && (
            <p className="mt-0.5 text-[11px] text-slate-400">{compact ? `Requested on ${requested}` : requested}</p>
          )}
        </div>
      </div>
      <StatusBadge status={request.status === 'Returned' ? 'Completed' : request.status} />
    </Link>
  );
};

const EmptyState = ({ text }) => (
  <p className="px-2 py-8 text-center text-xs leading-5 text-slate-400">{text}</p>
);

const AnnouncementsPanel = ({ compact = false }) => {
  const announcements = useApiList('/api/announcements');
  const visible = announcements.slice(0, compact ? 3 : 4);

  return (
    <section className="rounded-lg border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
        <h3 className="text-sm font-bold text-slate-900">Announcements</h3>
        <Link to="/announcements" className="text-xs font-bold text-[#1f5ff0] hover:underline">View all</Link>
      </div>
      <div className="divide-y divide-slate-100">
        {visible.map((item) => (
          <Link key={item.id} to="/announcements" className="flex gap-3 p-4 transition hover:bg-slate-50">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-50 text-[#1f5ff0]">
              <Bell size={14} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-start justify-between gap-2">
                <span className="text-sm font-bold leading-tight text-slate-900">{item.title}</span>
                {item.isNew && <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-500">New</span>}
              </span>
              <span className="mt-1 block text-[11px] font-medium text-slate-500">{item.department || item.dept}</span>
              {formatDate(item.createdAt) && (
                <span className="mt-0.5 block text-[10px] text-slate-400">{formatDate(item.createdAt)}</span>
              )}
            </span>
          </Link>
        ))}
        {!visible.length && <EmptyState text="No announcements have been published yet." />}
      </div>
      {!compact && (
        <div className="p-4">
          <Link to="/announcements" className="block rounded-md bg-[#1f5ff0] px-4 py-2.5 text-center text-xs font-bold text-white transition hover:bg-blue-700">
            View All Announcements
          </Link>
        </div>
      )}
    </section>
  );
};

const EquipmentThumb = ({ item, size = 'md' }) => (
  <span className={`${size === 'lg' ? 'h-14 w-14' : 'h-10 w-10'} grid shrink-0 place-items-center overflow-hidden rounded-md border border-slate-200 bg-slate-100`}>
    {item.image ? (
      <img src={item.image} alt="" onError={handleImageError} className="h-full w-full object-cover" />
    ) : (
      <Package size={18} className="text-slate-400" />
    )}
  </span>
);

const StatusBadge = ({ status }) => (
  <span className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-bold ${statusStyles[status] || statusStyles.Pending}`}>
    {status}
  </span>
);

export default Dashboard;

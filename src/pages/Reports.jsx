import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3, CalendarDays, Download, PieChart as PieChartIcon, Printer, TrendingUp, Users } from 'lucide-react';
import { reportData } from '../data/demoData';
import API_BASE_URL from '../config/api';

const Reports = () => {
  const [data, setData] = useState(reportData);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/api/dashboard/reports`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then((response) => {
        if (!response.ok) throw new Error('Reports could not be loaded.');
        return response.json();
      })
      .then((result) => active && setData(result))
      .catch(() => active && setMessage('Live reports are temporarily unavailable; demonstration values are shown.'));
    return () => { active = false; };
  }, []);

  const exportSummary = () => {
    const lines = [
      ['Metric', 'Value'],
      ['Total Users', data.stats.totalUsers],
      ['Active Loans', data.stats.activeLoans],
      ['Total Assets', data.stats.totalEquipment],
      ['Pending Requests', data.stats.pendingRequests],
      ['Total Interactions', data.stats.totalReservations],
    ];
    const blob = new Blob([lines.map((row) => row.join(',')).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'uniguide-report-summary.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reports</h1>
          <p className="mt-1 text-xs font-medium text-slate-500">Usage, inventory, request lifecycle, and institutional performance analytics.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm">
            <CalendarDays size={15} className="text-[#1f5ff0]" />
            Current Quarter
          </div>
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm">
            <Printer size={15} />
            PDF Summary
          </button>
          <button onClick={exportSummary} className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm">
            <Download size={15} />
            Export CSV
          </button>
        </div>
      </div>

      {message && <p role="status" className="rounded-md border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">{message}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <Kpi title="Total Users" value={data.stats.totalUsers} />
        <Kpi title="Active Loans" value={data.stats.activeLoans} />
        <Kpi title="Total Assets" value={data.stats.totalEquipment} />
        <Kpi title="Pending Requests" value={data.stats.pendingRequests} warning />
        <Kpi title="Total Interactions" value={data.stats.totalReservations} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartCard title="Weekly Activity" subtitle="Reservation volume over time" icon={BarChart3}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.weeklyActivity}>
              <defs>
                <linearGradient id="activityFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#1f5ff0" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#1f5ff0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} />
              <Tooltip contentStyle={{ border: '0', borderRadius: '8px', boxShadow: '0 10px 25px rgba(15,23,42,.12)' }} />
              <Area type="monotone" dataKey="value" stroke="#1f5ff0" strokeWidth={3} fill="url(#activityFill)" />
              <Area type="monotone" dataKey="prev" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="4 4" fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Stock by Department" subtitle="Equipment allocation mapping" icon={PieChartIcon}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.deptDistribution} layout="vertical" margin={{ left: 18 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={130} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ border: '0', borderRadius: '8px' }} />
              <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="User Demographics" subtitle="Community role breakdown" icon={Users}>
          <div className="grid h-full grid-cols-1 gap-3 md:grid-cols-[220px_1fr]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.roleDistribution} dataKey="value" innerRadius={56} outerRadius={82} paddingAngle={5} strokeWidth={0}>
                  {data.roleDistribution.map((entry, index) => <Cell key={entry.name} fill={['#1f5ff0', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#0ea5e9', '#64748b'][index]} />)}
                </Pie>
                <Tooltip contentStyle={{ border: '0', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col justify-center gap-3">
              {data.roleDistribution.map((entry, index) => (
                <LegendRow key={entry.name} label={entry.name} value={entry.value} color={['#1f5ff0', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#0ea5e9', '#64748b'][index]} total={data.stats.totalUsers} />
              ))}
            </div>
          </div>
        </ChartCard>

        <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-sm font-bold text-slate-900"><TrendingUp size={16} className="text-amber-500" /> High Demand Leaderboard</h2>
          <div className="space-y-3">
            {data.topEquipment.map((item, index) => (
              <div key={item.name} className="flex items-center gap-3 rounded-md bg-slate-50 p-3">
                <span className="grid h-9 w-9 place-items-center rounded-md bg-white text-xs font-bold text-[#1f5ff0] shadow-sm">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{item.name}</p>
                  <p className="text-[11px] font-medium text-slate-500">{item.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{item.count}</p>
                  <p className="text-[10px] font-bold text-slate-400">Requests</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const Kpi = ({ title, value, warning = false }) => (
  <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{title}</p>
    <h3 className="mt-2 text-3xl font-bold text-slate-900">{value}</h3>
    <p className={`mt-3 text-[11px] font-bold ${warning ? 'text-amber-600' : 'text-emerald-600'}`}>
      {warning ? 'Needs attention' : 'Verified system count'}
    </p>
  </div>
);

const ChartCard = ({ title, subtitle, icon: Icon, children }) => (
  <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
    <div className="mb-5 flex items-start justify-between">
      <div>
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-xs font-medium text-slate-500">{subtitle}</p>
      </div>
      <span className="grid h-9 w-9 place-items-center rounded-md bg-blue-50 text-[#1f5ff0]">
        <Icon size={17} />
      </span>
    </div>
    <div className="h-[310px]">{children}</div>
  </section>
);

const LegendRow = ({ label, value, color, total }) => (
  <div>
    <div className="mb-1 flex justify-between text-xs font-bold">
      <span className="flex items-center gap-2 text-slate-600"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} /> {label}</span>
      <span className="text-slate-900">{value}</span>
    </div>
    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full" style={{ backgroundColor: color, width: `${(value / total) * 100}%` }} />
    </div>
  </div>
);

export default Reports;
import { useEffect, useState } from 'react';

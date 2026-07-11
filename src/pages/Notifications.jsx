import { useEffect, useState } from 'react';
import { Bell, Check, CheckCircle, Clock, Settings, ShieldAlert, Trash2, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { notifications as demoNotifications } from '../data/demoData';

const Notifications = () => {
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem('uniguideNotifications')) || demoNotifications; } catch { return demoNotifications; }
  });
  const [filter, setFilter] = useState('all');
  const role = localStorage.getItem('userRole');
  const settingsTarget = ['Admin', 'IT Support'].includes(role) ? '/settings' : '/profile';

  useEffect(() => {
    localStorage.setItem('uniguideNotifications', JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter((item) => !item.read).length;
  const visibleNotifications = filter === 'unread' ? notifications.filter((item) => !item.read) : notifications;

  const markAsRead = (id) => setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
  const markAllAsRead = () => setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  const deleteNotification = (id) => setNotifications((current) => current.filter((item) => item.id !== id));

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-3 text-xl font-bold text-slate-900">
            Notifications
            {unreadCount > 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{unreadCount} New</span>}
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500">Stay updated with request approvals, alerts, announcements, and system notices.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={markAllAsRead} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-[#1f5ff0] shadow-sm">
            <Check size={15} />
            Mark all as read
          </button>
          <Link to={settingsTarget} className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-[#1f5ff0]" aria-label="Notification preferences">
            <Settings size={17} />
          </Link>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">
        <div className="flex gap-1 border-b border-slate-100 bg-slate-50 px-2 pt-2">
          <TabButton active={filter === 'all'} onClick={() => setFilter('all')}>All Notifications</TabButton>
          <TabButton active={filter === 'unread'} onClick={() => setFilter('unread')}>Unread {unreadCount > 0 ? `(${unreadCount})` : ''}</TabButton>
        </div>

        {visibleNotifications.length === 0 ? (
          <div className="grid place-items-center px-6 py-20 text-center">
            <Bell className="mb-3 text-slate-200" size={44} />
            <h2 className="text-base font-bold text-slate-700">You're all caught up</h2>
            <p className="mt-1 text-sm text-slate-400">No {filter === 'unread' ? 'unread ' : ''}notifications right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 p-2">
            {visibleNotifications.map((notification) => (
              <article key={notification.id} className={`relative flex gap-3 rounded-lg p-4 transition hover:bg-slate-50 ${notification.read ? 'bg-white' : 'bg-blue-50/35'}`}>
                {!notification.read && <span className="absolute left-0 top-1/2 h-9 w-1 -translate-y-1/2 rounded-r-full bg-[#1f5ff0]" />}
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${iconBg(notification.type)}`}>
                  <NotificationIcon type={notification.type} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-sm font-bold text-slate-900">{notification.title}</h3>
                    <span className="shrink-0 text-[11px] font-medium text-slate-400">{notification.timestamp}</span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{notification.message}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link to={notification.actionUrl} className="rounded-md bg-white px-3 py-1.5 text-xs font-bold text-[#1f5ff0] shadow-sm ring-1 ring-slate-200">
                      Open
                    </Link>
                    {!notification.read && (
                      <button onClick={() => markAsRead(notification.id)} className="rounded-md bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">
                        Mark read
                      </button>
                    )}
                    <button onClick={() => deleteNotification(notification.id)} className="rounded-md bg-white px-3 py-1.5 text-xs font-bold text-red-500 shadow-sm ring-1 ring-slate-200">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const TabButton = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`rounded-t-md border-b-2 px-4 py-3 text-xs font-bold transition ${active ? 'border-[#1f5ff0] bg-white text-[#1f5ff0]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
    {children}
  </button>
);

const NotificationIcon = ({ type }) => {
  if (type === 'approval') return <CheckCircle size={19} />;
  if (type === 'warning') return <Clock size={19} />;
  if (type === 'rejection') return <ShieldAlert size={19} />;
  if (type === 'announcement') return <Info size={19} />;
  return <Bell size={19} />;
};

const iconBg = (type) => {
  if (type === 'approval') return 'bg-emerald-50 text-emerald-600';
  if (type === 'warning') return 'bg-amber-50 text-amber-600';
  if (type === 'rejection') return 'bg-red-50 text-red-600';
  if (type === 'announcement') return 'bg-blue-50 text-[#1f5ff0]';
  return 'bg-slate-100 text-slate-600';
};

export default Notifications;

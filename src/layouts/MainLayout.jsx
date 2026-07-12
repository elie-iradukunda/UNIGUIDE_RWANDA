import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, 
  ScanLine, 
  ShoppingBag, 
  CheckCircle,
  Bell, 
  User as UserIcon, 
  LogOut,
  Menu,
  X,
  Package,
  FileText,
  Users,
  Settings,
  ClipboardList,
  BarChart3,
  Shield,
  Building2,
  Megaphone,
  MapPinned,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import API_BASE_URL from '../config/api';

const SidebarLink = ({ to, icon: Icon, label, active, onClick, badge }) => (
  <Link 
    to={to} 
    onClick={onClick}
    className={`flex items-center justify-between px-4 py-3 mx-4 my-1 rounded-md transition-all duration-200 group ${
      active 
        ? 'bg-[#1f5ff0] text-white shadow-md' 
        : 'text-[#94a3b8] hover:text-white hover:bg-white/5'
    }`}
  >
    <div className="flex items-center gap-3">
        <Icon size={18} strokeWidth={active ? 2.5 : 2} className={active ? 'text-white' : 'text-[#94a3b8] group-hover:text-white transition-colors'} />
        <span className={`text-sm ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
    </div>
    {badge && (
        <span className="bg-[#ef4444] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {badge}
        </span>
    )}
  </Link>
);

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole] = useState(() => localStorage.getItem('userRole') || 'Student');
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingRequestsBadge, setPendingRequestsBadge] = useState(0);

  useEffect(() => {
    const preferences = JSON.parse(localStorage.getItem('accessibilityPreferences') || '{}');
    document.documentElement.dataset.textSize = preferences.largeText ? 'large' : 'normal';
    document.documentElement.dataset.contrast = preferences.highContrast ? 'high' : 'normal';
  }, []);

  useEffect(() => {
    if (!['Admin', 'HOD', 'Lab Staff'].includes(userRole)) return undefined;
    const token = localStorage.getItem('token');
    if (!token) return undefined;

    let active = true;
    fetch(`${API_BASE_URL}/api/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => {
        if (active) setPendingRequestsBadge(Number(data.pendingReservations || 0));
      })
      .catch(() => active && setPendingRequestsBadge(0));

    return () => { active = false; };
  }, [userRole, location.pathname]);

  const handleLogout = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userRole");
      navigate("/login");
  };

  const menuItems = {
      'Student': [
          { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/scan', icon: ScanLine, label: 'Scan QR Code' },
          { to: '/lab-guide', icon: MapPinned, label: 'Laboratory Guide' },
          { to: '/my-items', icon: ShoppingBag, label: 'My Borrow Requests' },
          { to: '/approved-equipment', icon: CheckCircle, label: 'My Approved Equipment' },
          { to: '/announcements', icon: Megaphone, label: 'Announcements' },
          { to: '/notifications', icon: Bell, label: 'Notifications' },
          { to: '/profile', icon: UserIcon, label: 'My Profile' },
      ],
      'Lab Staff': [
          { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/equipment', icon: Package, label: 'Equipment Management' },
          { to: '/reservations', icon: ClipboardList, label: 'Borrow Requests', badge: pendingRequestsBadge },
          { to: '/lab-guide', icon: MapPinned, label: 'Laboratory Guide' },
          { to: '/announcements', icon: Megaphone, label: 'Announcements' },
          { to: '/profile', icon: UserIcon, label: 'My Profile' },
      ],
      'HOD': [
          { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/departments', icon: Building2, label: 'Department Overview' },
          { to: '/equipment', icon: Package, label: 'Equipment Management' },
          { to: '/reservations', icon: ClipboardList, label: 'Borrow Requests', badge: pendingRequestsBadge },
          { to: '/lab-guide', icon: MapPinned, label: 'Laboratory Guide' },
          { to: '/reports', icon: BarChart3, label: 'Reports' },
          { to: '/announcements', icon: Megaphone, label: 'Announcements' },
          { to: '/profile', icon: UserIcon, label: 'My Profile' },
      ],
      'Admin': [
          { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/users', icon: Users, label: 'User Management' },
          { to: '/roster', icon: ClipboardList, label: 'Student Enrolment List' },
          { to: '/departments', icon: Building2, label: 'Department Management' },
          { to: '/equipment', icon: Package, label: 'Equipment Management' },
          { to: '/lab-guide', icon: MapPinned, label: 'Laboratory Guide' },
          { to: '/reservations', icon: ClipboardList, label: 'Borrow Requests', badge: pendingRequestsBadge },
          { to: '/announcements', icon: Megaphone, label: 'Announcements' },
          { to: '/reports', icon: BarChart3, label: 'Reports' },
          { to: '/settings', icon: Settings, label: 'System Settings' },
      ]
  };

  const getMenu = () => {
      if (userRole === 'Lab Staff') return menuItems['Lab Staff'];
      if (userRole === 'HOD') return menuItems['HOD'];
      if (userRole === 'Admin') return menuItems['Admin'];
      return menuItems['Student'];
  };

  const isActiveRoute = (to) => {
      if (to === '/scan') return location.pathname === '/scan' || location.pathname.startsWith('/equipment/');
      if (to === '/equipment') return location.pathname === '/equipment';
      return location.pathname === to;
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans text-[#1e293b] overflow-hidden">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 w-[248px] bg-[#08162d] text-white flex flex-col shrink-0 z-50 
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand */}
        <div className="pt-6 pb-5 px-5 flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center">
                    <Shield size={19} className="text-[#08162d]" />
                </div>
                <h1 className="text-base font-bold tracking-tight text-white">UniGuide Rwanda</h1>
            </Link>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 hover:bg-white/10 rounded">
                <X size={20} />
            </button>
        </div>

        {/* User Profile Block */}
        <div className="px-5 pb-5 flex items-center gap-3">
            <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${user.fullName || 'User'}&background=1f5ff0&color=fff`} 
                alt="Profile" 
                className="w-12 h-12 rounded-full object-cover border-2 border-white/10"
            />
            <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold text-white truncate">{user.fullName || 'User'}</span>
                {/* Read the signed-in account's own department. This used to be hardcoded
                    to Mechatronics, so an ICT student was labelled as a Mechatronics one. */}
                <span className="text-[11px] text-[#94a3b8] truncate">
                    {userRole === 'Student' ? (user.department ? `${user.department} Student` : 'Student') :
                     userRole === 'Lab Staff' ? 'Lab Technician' :
                     userRole === 'HOD' ? 'Head of Department' :
                     userRole === 'Admin' ? 'System Administrator' : userRole}
                </span>
                {userRole !== 'Student' && userRole !== 'Admin' && user.department && (
                    <span className="text-[11px] text-[#94a3b8] truncate">{user.department} Department</span>
                )}
            </div>
        </div>

        <div className="w-full h-px bg-white/10 mb-4"></div>

        {/* Navigation */}
        <nav className="flex-1 py-2 flex flex-col gap-0.5 overflow-y-auto custom-scrollbar">
          {getMenu().map((item) => (
            <SidebarLink 
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              badge={item.badge}
              active={isActiveRoute(item.to)}
              onClick={() => setIsSidebarOpen(false)}
            />
          ))}
        </nav>

        <div className="py-4">
          <Link 
            to="/login"
            onClick={(e) => {
                e.preventDefault();
                handleLogout();
            }}
            className="flex items-center gap-3 px-4 py-3 mx-4 my-1 rounded-md text-[#94a3b8] hover:text-white hover:bg-white/5 transition-all group"
          >
            <LogOut size={20} className="text-[#94a3b8] group-hover:text-white" />
            <span className="text-sm font-medium">Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Dynamic Page Content */}
        <main id="main-content" tabIndex="-1" className="flex-1 overflow-y-auto bg-[#f8fafc] custom-scrollbar">
          <div className="mx-auto w-full min-h-full relative px-4 py-5 sm:px-6 lg:px-7">
              {/* Mobile menu trigger */}
              <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden absolute top-4 right-4 p-2 bg-white shadow-sm rounded-lg z-30"
              >
                  <Menu size={20} />
              </button>
              
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

import { useRef, useLayoutEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Equipment from './pages/Equipment';
import MyItems from './pages/MyItems';
import Reservations from './pages/Reservations';

import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Home from './pages/Home';
import ScanQR from './pages/ScanQR';
import EquipmentDetail from './pages/EquipmentDetail';
import Notifications from './pages/Notifications';
import Announcements from './pages/Announcements';
import Departments from './pages/Departments';
import Profile from './pages/Profile';
import LabGuide from './pages/LabGuide';

// Mock Auth - In a real app this would come from a Context/Store
const getUserRole = () => {
    return localStorage.getItem('userRole');
};

const AuthenticatedLayout = () => localStorage.getItem('token') ? <MainLayout /> : <Navigate to="/login" replace />;

const ProtectedRoute = ({ children, allowedRoles }) => {
    const role = getUserRole();
    if (!localStorage.getItem('token') || !role) return <Navigate to="/login" replace />;
    
    // Normalize role comparison (e.g. handle 'Staff' vs 'staff')
    const normalizedRole = role.toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());

    if (!normalizedAllowedRoles.includes(normalizedRole)) {
        return <Navigate to="/dashboard" replace />;
    }
    
    return children;
};

const ScrollToTop = ({ children }) => {
  const location = useLocation();
  const locationRef = useRef(location.pathname);
  
  useLayoutEffect(() => {
    if (locationRef.current !== location.pathname) {
      document.documentElement.scrollTo({ top: 0, left: 0, behavior: "instant" });
      locationRef.current = location.pathname;
    }
  }, [location.pathname]);

  return children;
};

function App() {
  return (
    <Router>
      <ScrollToTop>
         <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Dashboard Routes */}
            <Route path="/" element={<AuthenticatedLayout />}>
               {/* Role Based Views */}
               <Route path="dashboard" element={
                   <ProtectedRoute allowedRoles={['Student', 'Lecturer', 'Admin', 'Lab Staff', 'HOD', 'StockManager', 'IT Support', 'Staff']}>
                       <Dashboard />
                   </ProtectedRoute>
               } />
               <Route path="my-items" element={
                   <ProtectedRoute allowedRoles={['Student', 'Lecturer', 'Admin', 'Lab Staff', 'HOD', 'StockManager', 'Staff']}>
                       <MyItems />
                   </ProtectedRoute>
               } />
               <Route path="approved-equipment" element={
                   <ProtectedRoute allowedRoles={['Student', 'Lecturer', 'Admin', 'Lab Staff', 'HOD', 'StockManager', 'Staff']}>
                       <MyItems initialView="approved" />
                   </ProtectedRoute>
               } />
               <Route path="scan" element={
                   <ProtectedRoute allowedRoles={['Student', 'Lecturer', 'Admin', 'Lab Staff', 'HOD', 'StockManager', 'Staff']}>
                       <ScanQR />
                   </ProtectedRoute>
               } />
               <Route path="lab-guide" element={
                   <ProtectedRoute allowedRoles={['Student', 'Lecturer', 'Admin', 'Lab Staff', 'HOD', 'StockManager', 'IT Support']}>
                       <LabGuide />
                   </ProtectedRoute>
               } />
               <Route path="equipment/:id" element={
                   <ProtectedRoute allowedRoles={['Student', 'Lecturer', 'Admin', 'Lab Staff', 'HOD', 'StockManager', 'Staff']}>
                       <EquipmentDetail />
                   </ProtectedRoute>
               } />
               
               {/* Accessible by All */}
               <Route path="settings" element={<ProtectedRoute allowedRoles={['Admin', 'IT Support']}><Settings /></ProtectedRoute>} />
               <Route path="notifications" element={<Notifications />} />
               <Route path="announcements" element={<Announcements />} />
               <Route path="profile" element={<Profile />} />

               {/* Role Based Access Control */}
               
               {/* Equipment Management: Only for staff/admins managing inventory */}
               <Route path="equipment" element={
                   <ProtectedRoute allowedRoles={['Admin', 'HOD', 'StockManager', 'Appointed Staff', 'Lab Staff']}>
                       <Equipment />
                   </ProtectedRoute>
               } />

               {/* Reservations: Managing incoming requests */}
               <Route path="reservations" element={
                   <ProtectedRoute allowedRoles={['Admin', 'HOD', 'StockManager', 'Lab Staff']}>
                       <Reservations />
                   </ProtectedRoute>
               } />
               
               {/* Reports: Analytics for higher ups */}
               <Route path="reports" element={
                   <ProtectedRoute allowedRoles={['Admin', 'HOD', 'StockManager']}>
                       <Reports />
                   </ProtectedRoute>
               } />
               
               {/* User Management */}
               <Route path="users" element={
                   <ProtectedRoute allowedRoles={['Admin', 'IT Support']}>
                       <Users />
                   </ProtectedRoute>
               } />
               <Route path="departments" element={
                   <ProtectedRoute allowedRoles={['Admin', 'HOD']}>
                       <Departments />
                   </ProtectedRoute>
               } />
            </Route>
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
         </Routes>
      </ScrollToTop>
    </Router>
  );
}

export default App;

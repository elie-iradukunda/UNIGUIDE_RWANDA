import { X, UserPlus, Mail, Shield, BadgeCheck, Camera, Save, ChevronDown, Loader2, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';

const AddUserModal = ({ isOpen, onClose, editData = null }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'Student',
    department: 'ICT',
    studentId: '',
    canBorrow: true,
    canReserve: true,
    canViewReports: false,
    status: 'Active'
  });

  useEffect(() => {
    if (editData && isOpen) {
      setFormData({
        fullName: editData.fullName || '',
        email: editData.email || '',
        password: '', // Don't pre-fill password for security
        role: editData.role || 'Student',
        department: editData.department || 'ICT',
        studentId: editData.studentId || '',
        canBorrow: editData.canBorrow ?? true,
        canReserve: editData.canReserve ?? true,
        canViewReports: editData.canViewReports ?? false,
        status: editData.status || 'Active'
      });
    } else if (isOpen) {
       // Reset for new user
       setFormData({
        fullName: '',
        email: '',
        password: '',
        role: 'Student',
        department: 'ICT',
        studentId: '',
        canBorrow: true,
        canReserve: true,
        canViewReports: false,
        status: 'Active'
      });
    }
  }, [editData, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem('token');
      const url = editData ? `${API_BASE_URL}/api/users/${editData.id}` : `${API_BASE_URL}/api/users`;
      const method = editData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `Failed to ${editData ? 'update' : 'create'} user`);
      }

      onClose(true); // Close and refresh
      setFormData({
        fullName: '',
        email: '',
        password: '',
        role: 'Student',
        department: 'ICT',
        studentId: '',
        canBorrow: true,
        canReserve: true,
        canViewReports: false
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm shadow-2xl">
        {/* Modal Content */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-lg bg-white rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <h2 className="text-lg font-semibold text-[#2c3e50]">{editData ? 'Edit User' : 'Add New User'}</h2>
            <button 
              onClick={() => onClose(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-50"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
               {/* Avatar Upload */}
               <div className="flex items-center gap-5">
                  <div className="w-20 h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-full flex flex-col items-center justify-center text-gray-400 hover:border-[#1f4fa3] hover:text-[#1f4fa3] transition-colors cursor-pointer text-xs group shrink-0">
                     <Camera size={20} className="mb-1 text-gray-300 group-hover:text-[#1f4fa3] transition-colors" />
                     <span>Upload</span>
                  </div>
                  <div>
                     <h3 className="text-sm font-medium text-[#2c3e50]">Profile Photo</h3>
                     <p className="text-xs text-[#9ca3af] mt-1">
                        Recommended 400x400px. <br/> Max 2MB.
                     </p>
                  </div>
               </div>

               {error && (
                 <div className="p-3 bg-red-50 text-red-600 text-xs rounded border border-red-100">
                    {error}
                 </div>
               )}

               {/* Form Fields */}
               <div className="space-y-4">
                  <InputGroup 
                    label="Full Name" 
                    placeholder="e.g. Alice Johnson" 
                    icon={UserPlus} 
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                  <InputGroup 
                    label="Email Address" 
                    placeholder="alice.j@uni.edu" 
                    icon={Mail} 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <InputGroup 
                    label={editData ? "Reset Password (Leave blank to keep current)" : "Temporary Password"} 
                    placeholder={editData ? "••••••••" : "Leave blank for institutional default"} 
                    icon={Lock} 
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                     <SelectGroup 
                       label="System Role" 
                       name="role"
                       value={formData.role}
                       onChange={handleChange}
                     >
                        <option value="Student">Student</option>
                        <option value="Lecturer">Lecturer</option>
                        <option value="Admin">Admin</option>
                        <option value="HOD">HOD</option>
                        <option value="Lab Staff">Lab Staff</option>
                        <option value="StockManager">StockManager</option>
                     </SelectGroup>
                     <InputGroup 
                        label="User ID / Student ID" 
                        placeholder="ID-8929" 
                        icon={BadgeCheck} 
                        name="studentId"
                        value={formData.studentId}
                        onChange={handleChange}
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <SelectGroup 
                        label="Department" 
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                    >
                        <option value="Renewable Energy">Renewable Energy</option>
                        <option value="Mechatronic">Mechatronic</option>
                        <option value="ICT">ICT</option>
                        <option value="Electronic and Telecommunication">Electronic and Telecommunication</option>
                    </SelectGroup>
                    
                    {editData && (
                        <SelectGroup 
                            label="User Status" 
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Offline">Offline</option>
                        </SelectGroup>
                    )}
                  </div>
               </div>

               {/* Permissions */}
               <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                  <h4 className="text-sm font-medium text-[#2c3e50]">Access Permissions</h4>
                  <div className="space-y-2">
                     <Checkbox 
                        label="Allow borrowing equipment" 
                        name="canBorrow"
                        checked={formData.canBorrow}
                        onChange={handleChange}
                     />
                     <Checkbox 
                        label="Can make lab reservations" 
                        name="canReserve"
                        checked={formData.canReserve}
                        onChange={handleChange}
                     />
                     <Checkbox 
                        label="View system reports" 
                        name="canViewReports"
                        checked={formData.canViewReports}
                        onChange={handleChange}
                     />
                  </div>
               </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 z-10">
               <button 
                  type="button"
                  onClick={() => onClose(false)}
                  className="px-4 py-2 bg-white border border-gray-300 text-[#6b7280] rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
               >
                  Cancel
               </button>
               <button 
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#1f4fa3] text-white rounded-md text-sm font-medium hover:bg-[#173e82] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
               >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                  {loading ? (editData ? 'Updating...' : 'Creating...') : (editData ? 'Update User' : 'Create User')}
               </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const InputGroup = ({ label, placeholder, icon: Icon, type = "text", ...props }) => (
  <div className="space-y-1.5">
     <label className="block text-xs font-medium text-[#6b7280]">{label}</label>
     <div className="relative group">
        <input 
           type={type} 
           placeholder={placeholder}
           className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-[#2c3e50] placeholder:text-gray-300 focus:outline-none focus:border-[#1f4fa3] focus:ring-1 focus:ring-[#1f4fa3]/20 transition-all font-medium"
           {...props}
        />
        {Icon && <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1f4fa3] transition-colors" />}
     </div>
  </div>
);

const SelectGroup = ({ label, children, ...props }) => (
  <div className="space-y-1.5">
     <label className="block text-xs font-medium text-[#6b7280]">{label}</label>
     <div className="relative">
        <select 
           className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-[#2c3e50] font-medium appearance-none focus:outline-none focus:border-[#1f4fa3] focus:ring-1 focus:ring-[#1f4fa3]/20 transition-all cursor-pointer"
           {...props}
        >
           {children}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
     </div>
  </div>
);

const Checkbox = ({ label, checked, ...props }) => (
  <label className="flex items-center gap-2 cursor-pointer group">
     <input 
        type="checkbox" 
        checked={checked} 
        className="w-4 h-4 rounded border-gray-300 text-[#1f4fa3] focus:ring-[#1f4fa3]/20 cursor-pointer" 
        {...props}
     />
     <span className="text-xs text-[#6b7280] group-hover:text-[#2c3e50] transition-colors font-medium">{label}</span>
  </label>
);

export default AddUserModal;

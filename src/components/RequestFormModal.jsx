import React, { useState } from 'react';
import { X, Upload, Calendar, User, Book, MapPin, Info, CheckCircle2, Loader2, AlertCircle, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const RequestFormModal = ({ isOpen, onClose, item }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    studentRegNumber: '',
    studentIdNumber: '',
    studentIdImage: '',
    phoneNumber: '',
    level: '',
    department: '',
    purpose: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    additionalInfo: ''
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      setForm({ ...form, studentIdImage: res.data.url });
    } catch {
      setError("Failed to upload ID image");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentIdImage) {
      setError("Please upload a clear image of your Student ID");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...form,
        equipmentId: item.id
      };

      await axios.post(`${API_BASE_URL}/api/reservations`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
        >
          {/* Left Side - Info & Item Summary */}
          <div className="md:w-1/3 bg-slate-50 p-8 border-r border-slate-100 flex flex-col">
            <div className="mb-8">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                Asset Request
              </span>
              <h2 className="text-2xl font-bold text-slate-800 mt-4">{item.name}</h2>
              <p className="text-slate-500 text-sm mt-2">{item.category} • {item.modelNumber}</p>
            </div>

            <div className="flex-1 space-y-6">
               <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600 shrink-0 border border-slate-100">
                    <Info size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700">Formal Verification</h4>
                    <p className="text-xs text-slate-500 mt-1">Provide accurate details to help lab staff review your equipment request quickly.</p>
                  </div>
               </div>
               <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-600 shrink-0 border border-slate-100">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700">Digital Tracking</h4>
                    <p className="text-xs text-slate-500 mt-1">Every equipment loan is tracked for inventory safety and student accountability.</p>
                  </div>
               </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200">
               <div className="aspect-square rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                  <img src={item.image || "/placeholder-asset.png"} className="w-full h-full object-cover" alt={item.name} />
               </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="md:w-2/3 p-8 overflow-y-auto relative">
            <button onClick={onClose} className="absolute top-6 right-8 text-slate-400 hover:text-slate-600 transition">
              <X size={24} />
            </button>

            {success ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Request Submitted!</h3>
                  <p className="text-slate-500 mt-2 max-w-xs">Your request is being reviewed. You will be notified once lab staff approve it.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Student Verification Form</h3>
                  <p className="text-sm text-slate-500 mt-1">Please fill in all fields truthfully to proceed with your equipment request.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <User size={12} /> Registration Number
                    </label>
                    <input 
                      type="text" required placeholder="e.g. 21RP00345"
                      value={form.studentRegNumber}
                      onChange={(e) => setForm({...form, studentRegNumber: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Phone size={12} /> Contact Phone Number
                    </label>
                    <input 
                      type="tel" required placeholder="e.g. +250 788 000 000"
                      value={form.phoneNumber}
                      onChange={(e) => setForm({...form, phoneNumber: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Book size={12} /> National ID / Passport
                    </label>
                    <input 
                      type="text" required placeholder="ID Number..."
                      value={form.studentIdNumber}
                      onChange={(e) => setForm({...form, studentIdNumber: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Education Level</label>
                    <input 
                      type="text" required placeholder="e.g. Level 4, Year 2..."
                      value={form.level}
                      onChange={(e) => setForm({...form, level: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</label>
                  <select 
                    required
                    value={form.department}
                    onChange={(e) => setForm({...form, department: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                  >
                     <option value="">Select Department</option>
                     <option value="ICT">ICT</option>
                     <option value="Renewable Energy">Renewable Energy</option>
                     <option value="Electronic & Telecomm">Electronic & Telecomm</option>
                     <option value="Mechanical Engineering">Mechanical Engineering</option>
                     <option value="Civil Engineering">Civil Engineering</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload Student ID Photo</label>
                   <div className="relative group">
                      <input 
                        type="file" accept="image/*" onChange={handleImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className={`p-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${form.studentIdImage ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50 group-hover:border-blue-300'}`}>
                         {form.studentIdImage ? (
                           <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg overflow-hidden border border-emerald-200 shadow-sm">
                                 <img src={form.studentIdImage} className="w-full h-full object-cover" alt="ID Uploaded" />
                              </div>
                              <span className="text-sm font-bold text-emerald-700">Identity Verified</span>
                              <CheckCircle2 className="text-emerald-500" size={18} />
                           </div>
                         ) : (
                           <>
                             <Upload className="text-slate-300 mb-2 group-hover:text-blue-500 transition-colors" size={24} />
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Click to upload clear ID photo</p>
                           </>
                         )}
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar size={12} /> Pickup Date
                    </label>
                    <input 
                      type="date" required
                      value={form.startDate}
                      onChange={(e) => setForm({...form, startDate: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar size={12} /> Expected Return
                    </label>
                    <input 
                      type="date" required
                      value={form.endDate}
                      onChange={(e) => setForm({...form, endDate: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <MapPin size={12} /> Reason for Request
                  </label>
                  <textarea 
                    required rows="2" placeholder="Describe why you need this equipment and where it will be used..."
                    value={form.purpose}
                    onChange={(e) => setForm({...form, purpose: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium resize-none shadow-sm"
                  ></textarea>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Info size={12} /> Additional Information (Optional)
                  </label>
                  <textarea 
                    rows="2" placeholder="Special requirements, location of use, etc..."
                    value={form.additionalInfo}
                    onChange={(e) => setForm({...form, additionalInfo: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium resize-none shadow-sm"
                  ></textarea>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-shake">
                    <AlertCircle size={20} />
                    <p className="text-xs font-bold uppercase tracking-wider">{error}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={onClose} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition shadow-sm text-sm">
                    Cancel
                  </button>
                  <button 
                    type="submit" disabled={loading}
                    className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-500/30 text-sm disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Submit formal Request"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RequestFormModal;

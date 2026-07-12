import { X, Camera, Info, Save, ChevronDown, Plus, Trash2, Youtube, Image as ImageIcon, FileText, Settings, ShieldCheck, Database, MapPin, DollarSign, Activity, AlertCircle, CheckCircle2, Upload, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useId, useMemo, useState } from 'react';
import API_BASE_URL from '../config/api';

const INITIAL_FORM_STATE = {
  name: '', modelNumber: '', category: 'Electronics', department: 'ICT',
  serialNumber: '', assetTag: '', description: '', purchaseDate: '', warrantyExpiry: '',
  cost: '', supplier: 'Official Store', requiresMaintenance: false, allowOvernight: false,
  image: '', manualUrl: '', safetyManualUrl: '', videoUrls: [{ title: '', url: '' }], galleryImages: [''],
  learningMaterials: [],
  status: 'Available', location: 'Main Storage', stock: 1, available: 1,
};

const EMPTY_MATERIAL = { title: '', type: 'PDF Manual', url: '' };

const tryParseArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
      try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [value];
      } catch {
          return [value];
      }
  }
  return [''];
};

const normalizeMaterials = (value) => {
  const parsed = tryParseArray(value);
  return parsed
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      title: item.title || '',
      type: item.type || 'PDF Manual',
      url: item.url || '',
    }));
};

const normalizeVideos = (value) => {
  const parsed = tryParseArray(value);
  const videos = parsed
    .map((item) => {
      if (typeof item === 'string') return { title: '', url: item };
      return { title: item?.title || '', url: item?.url || '' };
    })
    .filter((item) => item.url || item.title);
  return videos.length ? videos : [{ title: '', url: '' }];
};

const AddEquipmentModal = ({ isOpen, onClose, editData = null }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [uploading, setUploading] = useState(null); 
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);

  useEffect(() => {
    if (editData && isOpen) {
       setFormData({
          ...INITIAL_FORM_STATE,
          ...editData,
          videoUrls: normalizeVideos(editData.videoUrls),
          galleryImages: tryParseArray(editData.galleryImages),
          learningMaterials: normalizeMaterials(editData.learningMaterials)
       });
    } else if (!editData && isOpen) {
       // Reset for new item, default to user department
       setFormData({
           ...INITIAL_FORM_STATE,
           department: user?.role !== 'Admin' ? (user?.department || INITIAL_FORM_STATE.department) : INITIAL_FORM_STATE.department
       });
    }
  }, [editData, isOpen, user]);

  const tabs = useMemo(() => [
    { id: 'basic', label: 'Basic Info', icon: Database, restrict: ['Admin', 'HOD', 'Lab Staff'] },
    { id: 'media', label: 'Media & Docs', icon: ImageIcon, restrict: ['Admin', 'HOD', 'Lab Staff'] },
    { id: 'inventory', label: 'Inventory & Value', icon: DollarSign, restrict: ['Admin', 'HOD', 'Lab Staff'] },
    { id: 'settings', label: 'Policy & Status', icon: Settings, restrict: ['Admin', 'HOD', 'Lab Staff'] }
  ].filter(tab => !tab.restrict || tab.restrict.includes(user?.role)), [user?.role]);

  useEffect(() => {
     if (tabs.length > 0 && !tabs.find(t => t.id === activeTab)) {
         setActiveTab(tabs[0].id);
     }
  }, [activeTab, tabs]);

  if (!isOpen) return null;

  const handleChange = (e) => {
     const { name, value, type, checked } = e.target;
     setFormData(prev => {
         const newData = {
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
         };
         // If stock changes, update available by default if it was the same
         if (name === 'stock' && prev.available === prev.stock) {
             newData.available = Number(value);
         }
         return newData;
     });
  };

  const handleArrayChange = (index, value, field) => {
     const newArray = [...formData[field]];
     newArray[index] = value;
     setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const handleVideoChange = (index, key, value) => {
     const newVideos = [...formData.videoUrls];
     newVideos[index] = { ...newVideos[index], [key]: value };
     setFormData(prev => ({ ...prev, videoUrls: newVideos }));
  };

  const handleMaterialChange = (index, key, value) => {
     const materials = [...formData.learningMaterials];
     materials[index] = { ...materials[index], [key]: value };
     setFormData(prev => ({ ...prev, learningMaterials: materials }));
  };

  const addArrayItem = (field) => {
     if (field === 'videoUrls') {
         setFormData(prev => ({ ...prev, videoUrls: [...prev.videoUrls, { title: '', url: '' }] }));
     } else if (field === 'learningMaterials') {
         setFormData(prev => ({ ...prev, learningMaterials: [...prev.learningMaterials, { ...EMPTY_MATERIAL }] }));
     } else {
         setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
     }
  };

  const removeArrayItem = (index, field) => {
     const newArray = formData[field].filter((_, i) => i !== index);
     setFormData(prev => ({ ...prev, [field]: newArray }));
  };



  const handleFileUpload = async (e, field, index = null) => {
      const file = e.target.files[0];
      if (!file) return;

      const uploadKey = index !== null ? `${field}-${index}` : field;
      setUploading(uploadKey);

      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_BASE_URL}/api/upload`, {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${token}`
              },
              body: uploadFormData
          });

          if (!response.ok) throw new Error('Upload failed');

          const data = await response.json();
          if (index !== null) {
              if (field === 'learningMaterials') {
                  handleMaterialChange(index, 'url', data.url);
              } else {
                  handleArrayChange(index, data.url, field);
              }
          } else {
              setFormData(prev => ({ ...prev, [field]: data.url }));
          }
      } catch (err) {
          alert('Upload failed: ' + err.message);
      } finally {
          setUploading(null);
      }
  };

  const handleSubmit = async (e) => {
     e.preventDefault();
     setLoading(true);
     try {
        const token = localStorage.getItem('token');
        // Filter out empty strings from arrays and convert empty strings to null for optional DB numeric/date fields
        const cleanData = {
           ...formData,
           cost: formData.cost === '' ? null : formData.cost,
           purchaseDate: formData.purchaseDate === '' ? null : formData.purchaseDate,
           warrantyExpiry: formData.warrantyExpiry === '' ? null : formData.warrantyExpiry,
           videoUrls: normalizeVideos(formData.videoUrls).filter(v => v.url.trim() !== ''),
           galleryImages: formData.galleryImages.filter(url => url.trim() !== ''),
           learningMaterials: formData.learningMaterials.filter((item) => item.title.trim() && item.url.trim())
        };

        const url = editData 
            ? `${API_BASE_URL}/api/equipment/${editData.id}` 
            : `${API_BASE_URL}/api/equipment`;
        
        const method = editData ? 'PUT' : 'POST';

        const response = await fetch(url, {
           method: method,
           headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
           },
           body: JSON.stringify(cleanData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Failed to ${editData ? 'update' : 'create'} equipment`);
        }
        
        onClose(true, `Successfully ${editData ? 'updated' : 'registered'} ${formData.name}`);
     } catch (error) {
        console.error(error);
        alert(error.message);
     } finally {
        setLoading(false);
     }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <div>
                <h2 className="text-2xl font-bold text-[#2c3e50]">{editData ? 'Edit Equipment' : 'Catalog Manager'}</h2>
                <p className="text-sm text-[#6b7280]">
                    {editData ? `Updating ${editData.name}` : 'Register new institutional assets with full specifications.'}
                </p>
            </div>
            <button onClick={() => onClose(false)} className="text-[#9ca3af] hover:text-[#2c3e50] p-2 rounded-full hover:bg-gray-100 transition-all">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar Tabs */}
            <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 p-4 space-y-2 shrink-0 overflow-y-auto">
               {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                       activeTab === tab.id 
                          ? 'bg-[#1f4fa3] text-white shadow-lg shadow-blue-900/10' 
                          : 'text-[#6b7280] hover:bg-white hover:text-[#2c3e50]'
                    }`}
                  >
                     <tab.icon size={18} />
                     {tab.label}
                  </button>
               ))}
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 bg-white">
               
               {activeTab === 'basic' && (() => {
                  const isSpecLocked = false;
                  return (
                   <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <SectionHeader title="Identification Details" subtitle={isSpecLocked ? 'Core specifications are locked. You can edit description below.' : 'Unique codes and descriptive information.'} />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="Equipment Name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Solar PV Training System" required disabled={isSpecLocked} />
                        <InputGroup label="Model Number" name="modelNumber" value={formData.modelNumber} onChange={handleChange} placeholder="SUN-TRAIN-01" disabled={isSpecLocked} />
                        
                        <InputGroup 
                           label="Category" 
                           name="category" 
                           value={formData.category} 
                           onChange={handleChange} 
                           placeholder="e.g. Robotics, Automation, Lab Kits..." 
                           required 
                           disabled={isSpecLocked}
                        />
                        
                        <SelectGroup 
                           label="Department" 
                           name="department" 
                           value={formData.department} 
                           onChange={handleChange}
                           disabled={user?.role !== 'Admin'}
                        >
                           <option>Renewable Energy</option>
                           <option>Mechatronic</option>
                           <option>ICT</option>
                           <option>Electronic and Telecommunication</option>
                        </SelectGroup>

                        <InputGroup label="Serial Number" name="serialNumber" value={formData.serialNumber} onChange={handleChange} placeholder="SN-10293845" disabled={isSpecLocked} />
                        <InputGroup label="Asset Tag ID" name="assetTag" value={formData.assetTag} onChange={handleChange} placeholder="TAG-SOL-001" disabled={isSpecLocked} />
                        
                        {(user?.role === 'Admin' || user?.role === 'Lab Staff' || user?.role === 'HOD') && (
                            <div className="md:col-span-2">
                               <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Detailed Description</label>
                               <textarea 
                                  name="description"
                                  value={formData.description}
                                  onChange={handleChange}
                                  rows="4" 
                                  placeholder="Technical specifications, key features and usage instructions..."
                                  className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm text-[#2c3e50] focus:bg-white focus:border-[#1f4fa3] transition-all resize-none outline-none ring-offset-2"
                               ></textarea>
                            </div>
                        )}
                     </div>
                  </motion.div>
                  );
                })()}

               {activeTab === 'media' && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 text-sm">
                     <SectionHeader title="Media Attachments" subtitle="Visual guides and equipment tutorials." />
                     
                     {/* Main Image */}
                     <div className="space-y-4">
                        <InputGroup 
                           label="Primary Showcase Image URL" 
                           name="image" 
                           value={formData.image} 
                           onChange={handleChange} 
                           placeholder="https://..." 
                           icon={ImageIcon} 
                           onFileChange={(e) => handleFileUpload(e, 'image')}
                           isUploading={uploading === 'image'}
                        />
                        {formData.image && (
                           <div className="w-full h-40 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center">
                              <img src={formData.image} className="w-full h-full object-contain" alt="Preview" />
                           </div>
                        )}
                     </div>
                     
                     {/* Gallery */}
                     <div className="space-y-4 pt-4 border-t border-gray-50">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Additional Gallery Shots (Multiple)</label>
                        <div className="space-y-3">
                           {formData.galleryImages.map((url, idx) => (
                              <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-right-2">
                                 <div className="flex-1">
                                    <InputGroup 
                                       label="" 
                                       value={url}
                                       onChange={(e) => handleArrayChange(idx, e.target.value, 'galleryImages')}
                                       placeholder="Additional Image URL"
                                       icon={ImageIcon}
                                       onFileChange={(e) => handleFileUpload(e, 'galleryImages', idx)}
                                       isUploading={uploading === `galleryImages-${idx}`}
                                    />
                                 </div>
                                 <button type="button" onClick={() => removeArrayItem(idx, 'galleryImages')} className="text-red-400 hover:text-red-500 hover:bg-red-50 p-3 rounded-xl transition-all h-fit self-end mb-0.5"><Trash2 size={20} /></button>
                              </div>
                           ))}
                           <button type="button" onClick={() => addArrayItem('galleryImages')} className="w-full py-3 border-2 border-dashed border-gray-100 rounded-xl text-xs font-bold text-[#1f4fa3] flex items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-100 transition-all">
                              <Plus size={16} /> Add Image Slot
                           </button>
                        </div>
                     </div>

                     <div className="space-y-4 pt-4 border-t border-gray-50">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Training Modules (Videos/Manuals)</label>
                        <div className="space-y-3">
                           {formData.videoUrls.map((video, idx) => (
                              <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-right-2">
                                 <div className="flex-1 space-y-2">
                                    <InputGroup 
                                       label="" 
                                       value={video.title}
                                       onChange={(e) => handleVideoChange(idx, 'title', e.target.value)}
                                       placeholder="Video Title (e.g. Setup Guide)"
                                    />
                                    <InputGroup 
                                       label="" 
                                       value={video.url}
                                       onChange={(e) => handleVideoChange(idx, 'url', e.target.value)}
                                       placeholder="https://youtube.com/watch?v=..."
                                       icon={Youtube}
                                    />
                                 </div>
                                 <button type="button" onClick={() => removeArrayItem(idx, 'videoUrls')} className="text-red-400 hover:text-red-500 hover:bg-red-50 p-3 rounded-xl transition-all h-fit self-center mb-0.5"><Trash2 size={20} /></button>
                              </div>
                           ))}
                           <button type="button" onClick={() => addArrayItem('videoUrls')} className="w-full py-3 border-2 border-dashed border-gray-100 rounded-xl text-xs font-bold text-[#1f4fa3] flex items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-100 transition-all">
                              <Plus size={16} /> Add Video Module
                           </button>
                        </div>
                     </div>

                     <div className="space-y-4 pt-4 border-t border-gray-50">
                        <SectionHeader
                          title="Additional Learning Materials"
                          subtitle="Attach PDF manuals, PowerPoint slides, Word guides, uploaded videos, or YouTube tutorials students can open from the equipment QR page."
                        />
                        <div className="space-y-3">
                           {formData.learningMaterials.length === 0 && (
                              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-xs font-medium text-gray-500">
                                 No extra materials yet. Add a file or link for this equipment.
                              </div>
                           )}
                           {formData.learningMaterials.map((material, idx) => (
                              <div key={idx} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                                 <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_auto]">
                                    <InputGroup
                                       label="Title"
                                       value={material.title}
                                       onChange={(e) => handleMaterialChange(idx, 'title', e.target.value)}
                                       placeholder="e.g. Setup slides, student worksheet, safety checklist"
                                    />
                                    <SelectGroup
                                       label="Type"
                                       value={material.type}
                                       onChange={(e) => handleMaterialChange(idx, 'type', e.target.value)}
                                    >
                                       <option>PDF Manual</option>
                                       <option>PowerPoint Slides</option>
                                       <option>Word Guide</option>
                                       <option>YouTube Tutorial</option>
                                       <option>Uploaded Video</option>
                                       <option>Image Reference</option>
                                       <option>Other File</option>
                                    </SelectGroup>
                                    <button type="button" onClick={() => removeArrayItem(idx, 'learningMaterials')} className="self-end rounded-xl p-3 text-red-400 transition-all hover:bg-red-50 hover:text-red-500">
                                       <Trash2 size={20} />
                                    </button>
                                 </div>
                                 <div className="mt-3">
                                    <InputGroup
                                       label="Material Link or Uploaded File"
                                       value={material.url}
                                       onChange={(e) => handleMaterialChange(idx, 'url', e.target.value)}
                                       placeholder="Paste YouTube/link here or upload PDF, PPT, DOCX, MP4..."
                                       icon={FileText}
                                       onFileChange={(e) => handleFileUpload(e, 'learningMaterials', idx)}
                                       isUploading={uploading === `learningMaterials-${idx}`}
                                    />
                                 </div>
                              </div>
                           ))}
                           <button type="button" onClick={() => addArrayItem('learningMaterials')} className="w-full py-3 border-2 border-dashed border-gray-100 rounded-xl text-xs font-bold text-[#1f4fa3] flex items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-100 transition-all">
                              <Plus size={16} /> Add Learning Material
                           </button>
                        </div>
                     </div>
                     
                     {/* Manual */}
                     <div className="pt-4 border-t border-gray-50 space-y-4">
                        <InputGroup 
                           label="PDF Documentation URL (User Manual)" 
                           name="manualUrl" 
                           value={formData.manualUrl} 
                           onChange={handleChange} 
                           placeholder="Direct link to user manual.pdf" 
                           icon={FileText} 
                           onFileChange={(e) => handleFileUpload(e, 'manualUrl')}
                           isUploading={uploading === 'manualUrl'}
                        />
                        <InputGroup 
                           label="Safety Instructions PDF URL" 
                           name="safetyManualUrl" 
                           value={formData.safetyManualUrl} 
                           onChange={handleChange} 
                           placeholder="Direct link to safety manual.pdf" 
                           icon={AlertCircle} 
                           onFileChange={(e) => handleFileUpload(e, 'safetyManualUrl')}
                           isUploading={uploading === 'safetyManualUrl'}
                        />
                     </div>
                  </motion.div>
               )}

               {activeTab === 'inventory' && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                     <SectionHeader title="Inventory & Financials" subtitle="Track stock levels and acquisition value." />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="Stock Level (Total)" name="stock" type="number" value={formData.stock} onChange={handleChange} icon={Database} min="1" />
                        <InputGroup label="Initially Available" name="available" type="number" value={formData.available} onChange={handleChange} icon={Activity} min="0" />
                        
                        <div className="hidden md:block"></div>

                        <InputGroup label="Purchase Cost (USD)" name="cost" type="number" value={formData.cost} onChange={handleChange} placeholder="0.00" icon={DollarSign} />
                        <SelectGroup label="Preferred Supplier" name="supplier" value={formData.supplier} onChange={handleChange}>
                           <option>Official Store</option>
                           <option>Amazon Business</option>
                           <option>Local Vendor</option>
                        </SelectGroup>

                        <InputGroup label="Installation/Purchase Date" name="purchaseDate" type="date" value={formData.purchaseDate} onChange={handleChange} />
                        <InputGroup label="Warranty Period Expiry" name="warrantyExpiry" type="date" value={formData.warrantyExpiry} onChange={handleChange} />
                     </div>
                  </motion.div>
               )}

               {activeTab === 'settings' && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                     <SectionHeader title="Access Policies & Status" subtitle="Set borrowing rules and current condition." />
                     
                     <div className="md:col-span-2 pb-6 border-b border-gray-50">
                        <InputGroup label="Physical Storage Location" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Lab 03, Shelf B-12" icon={MapPin} />
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-50">
                        <SelectGroup label="Current Item Condition" name="status" value={formData.status} onChange={handleChange}>
                           <option>Available</option>
                           <option>In Use</option>
                           <option>Maintenance</option>
                           <option>Pending Lab Verification</option>
                           <option>Lost</option>
                           <option>Retired</option>
                        </SelectGroup>
                        <div className="hidden md:block"></div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ToggleCard 
                           title="Maintenance Required" 
                           subtitle="Requires periodic technical checkups" 
                           icon={AlertCircle}
                           name="requiresMaintenance" 
                           checked={formData.requiresMaintenance} 
                           onChange={handleChange} 
                        />
                        <ToggleCard 
                           title="Overnight Access" 
                           subtitle="Students can carry home" 
                           icon={ShieldCheck}
                           name="allowOvernight" 
                           checked={formData.allowOvernight} 
                           onChange={handleChange} 
                        />
                     </div>
                  </motion.div>
               )}

               {/* Submit Area (Float?) */}
               <div className="pt-8 flex justify-end gap-4 border-t border-gray-100">
                  <button type="button" onClick={() => onClose(false)} className="px-6 py-3 bg-white border border-gray-200 text-[#6b7280] rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">
                     Discard
                  </button>
                  <button 
                     type="submit"
                     disabled={loading}
                     className="px-8 py-3 bg-[#1f4fa3] text-white rounded-xl text-sm font-bold hover:bg-[#173e82] transition-all flex items-center gap-2 shadow-xl shadow-blue-900/20 disabled:opacity-70"
                  >
                     {loading ? 'Processing...' : (
                        <><Save size={18} /> {editData ? 'Update Asset' : 'Register Asset'}</>
                     )}
                  </button>
               </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const SectionHeader = ({ title, subtitle }) => (
   <div className="mb-6">
      <h3 className="text-lg font-bold text-[#2c3e50]">{title}</h3>
      <p className="text-xs text-[#6b7280]">{subtitle}</p>
   </div>
);

const InputGroup = ({ label, placeholder, type = "text", name, value, onChange, icon: Icon, required, min, onFileChange, isUploading, disabled }) => {
  const generatedId = useId();
  const fileInputId = `file-upload-${name || generatedId}`;
  
  return (
    <div className="space-y-1.5 flex-1">
       {label && <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</label>}
       <div className="relative group flex items-center gap-2">
          <div className="relative flex-1">
             <input 
                type={type} 
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                min={min}
                disabled={disabled}
                className={`w-full ${Icon ? 'pl-11' : 'px-4'} pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-[13px] text-[#2c3e50] placeholder:text-gray-300 focus:bg-white focus:border-[#1f4fa3] transition-all outline-none ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
             />
             {Icon && <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#1f4fa3] transition-colors" />}
          </div>
          
          {onFileChange && (
             <>
                <input 
                   type="file" 
                   id={fileInputId}
                   className="hidden" 
                   onChange={onFileChange}
                />
                <label 
                   htmlFor={fileInputId}
                   className={`shrink-0 p-3 rounded-xl border-2 border-transparent bg-gray-50 text-gray-400 hover:bg-white hover:border-[#1f4fa3] hover:text-[#1f4fa3] transition-all cursor-pointer flex items-center justify-center ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                   {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                </label>
             </>
          )}
       </div>
    </div>
  );
};

const SelectGroup = ({ label, children, name, value, onChange, disabled }) => (
  <div className="space-y-1.5 flex-1">
     <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</label>
     <div className="relative">
        <select 
           name={name}
           value={value}
           onChange={onChange}
           disabled={disabled}
           className={`w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-[13px] text-[#2c3e50] appearance-none focus:bg-white focus:border-[#1f4fa3] transition-all cursor-pointer outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
           {children}
        </select>
        {!disabled && <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />}
     </div>
  </div>
);

const ToggleCard = ({ title, subtitle, icon: Icon, name, checked, onChange }) => (
   <div className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${checked ? 'border-[#1f4fa3]/20 bg-blue-50/30' : 'border-gray-50 bg-gray-50/50'}`}>
      <div className="flex items-center gap-3">
         <div className={`p-2 rounded-lg ${checked ? 'bg-[#1f4fa3] text-white shadow-lg shadow-blue-900/10' : 'bg-white text-gray-400 shadow-sm'}`}>
            <Icon size={18} />
         </div>
         <div>
            <h4 className={`text-[13px] font-bold ${checked ? 'text-[#1f4fa3]' : 'text-[#2c3e50]'}`}>{title}</h4>
            <p className="text-[10px] text-gray-400 font-medium">{subtitle}</p>
         </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
         <input type="checkbox" name={name} className="sr-only peer" checked={checked} onChange={onChange} />
         <div className="w-10 h-5.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1f4fa3]"></div>
      </label>
   </div>
);

export default AddEquipmentModal;

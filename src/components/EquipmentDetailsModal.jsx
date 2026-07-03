import { X, Calendar, Download, Play, ChevronRight, AlertCircle, Camera, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import RequestFormModal from './RequestFormModal';

const EquipmentDetailsModal = ({ isOpen, onClose, equipment, readOnly = false }) => {
  const [activeImage, setActiveImage] = useState(0);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const navigate = useNavigate();

  if (!isOpen || !equipment) return null;

  // Safe JSON parse helper
  const tryParseJSON = (jsonString) => {
      try {
          const parsed = JSON.parse(jsonString);
          return Array.isArray(parsed) ? parsed : [];
      } catch {
          return [];
      }
  };

  // Combine main image and gallery into one list
  const images = [];
  if (equipment.image) images.push(equipment.image);
  
  let gallery = equipment.galleryImages;
  if (typeof gallery === 'string') {
      gallery = tryParseJSON(gallery);
  }
  if (Array.isArray(gallery)) {
      images.push(...gallery);
  }

  // Parse videos
  let videos = [];
  if (Array.isArray(equipment.videoUrls)) {
      videos = equipment.videoUrls;
  } else {
      videos = tryParseJSON(equipment.videoUrls);
  }
  
  // Robust YouTube ID extraction
  const getYoutubeEmbedUrl = (url) => {
      if (!url) return null;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) 
        ? `https://www.youtube.com/embed/${match[2]}` 
        : null;
  };

  const handleRequestInit = () => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    setRequestModalOpen(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
            <div>
                <h2 className="text-xl font-bold text-[#2c3e50]">{equipment.name}</h2>
                <p className="text-sm text-[#6b7280]">
                    {equipment.modelNumber} • <span className="text-[#1f4fa3] font-medium">{equipment.category}</span>
                </p>
            </div>
            <button onClick={onClose} className="text-[#9ca3af] hover:text-[#2c3e50] p-2 rounded-full hover:bg-gray-100 transition-all">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 relative">
                  
                  {/* Left Column: Media Gallery */}
                  <div className="lg:col-span-7 bg-gray-50 p-6 lg:p-8 flex flex-col gap-6 border-r border-gray-100">
                      
                      {/* Main Image Stage */}
                      <div className="aspect-video bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex items-center justify-center relative group">
                          {images.length > 0 ? (
                              <img 
                                src={images[activeImage].startsWith('http') ? images[activeImage] : `${API_BASE_URL}${images[activeImage]}`} 
                                alt={equipment.name} 
                                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" 
                              />
                          ) : (
                              <div className="text-gray-300 flex flex-col items-center">
                                  <Camera size={48} />
                                  <span className="text-sm mt-2">No images available</span>
                              </div>
                          )}
                          
                          {/* Status Badge Overlay */}
                          <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                              equipment.status === 'Available' ? 'bg-green-100 text-green-700' : 
                              equipment.status === 'In Use' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                          }`}>
                              {equipment.status}
                          </div>
                      </div>

                      {/* Thumbnail Strip */}
                      {images.length > 1 && (
                          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                              {images.map((img, idx) => (
                                  <button 
                                    key={idx}
                                    onClick={() => setActiveImage(idx)}
                                    className={`w-20 h-16 shrink-0 rounded-md border-2 overflow-hidden bg-white transition-all ${activeImage === idx ? 'border-[#1f4fa3] ring-2 ring-[#1f4fa3]/20' : 'border-transparent hover:border-gray-300'}`}
                                  >
                                      <img 
                                        src={img.startsWith('http') ? img : `${API_BASE_URL}${img}`} 
                                        className="w-full h-full object-cover" 
                                      />
                                  </button>
                              ))}
                          </div>
                      )}

                      {/* Video Section */}
                      {videos.length > 0 && (
                          <div className="mt-4 pt-6 border-t border-gray-200">
                              <h3 className="text-sm font-bold text-[#2c3e50] mb-3 flex items-center gap-2">
                                  <Play size={16} className="text-[#1f4fa3]" /> Equipment Guides & Tutorials
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {videos.filter(v => v).map((vid, idx) => {
                                      const embedUrl = getYoutubeEmbedUrl(vid);
                                      return (
                                          <div key={idx} className="aspect-video rounded-lg overflow-hidden shadow-sm border border-gray-200 bg-black relative group">
                                              {embedUrl ? (
                                                  <iframe 
                                                      src={embedUrl}
                                                      className="w-full h-full" 
                                                      allowFullScreen 
                                                      title={`Video ${idx}`}
                                                  />
                                              ) : (
                                                  <video 
                                                    src={vid.startsWith('http') ? vid : `${API_BASE_URL}${vid}`} 
                                                    controls 
                                                    className="w-full h-full"
                                                  />
                                              )}
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Right Column: Details & Actions */}
                  <div className="lg:col-span-5 p-6 lg:p-8 flex flex-col h-full bg-white">
                      
                      {/* Description */}
                      <div className="mb-6">
                          <h3 className="text-sm font-bold text-[#2c3e50] mb-2 uppercase tracking-wider text-xs">Description</h3>
                          <div className="text-sm text-[#6b7280] leading-relaxed whitespace-pre-wrap">
                              {equipment.description ? (
                                  <p>{equipment.description}</p>
                              ) : (
                                  <p className="italic text-gray-400">No detailed description available.</p>
                              )}
                          </div>
                      </div>

                      {/* Specs - Only for Admin/Staff/Manager */}
                      {(['Admin', 'HOD', 'StockManager', 'Lab Staff', 'Appointed Staff'].includes(localStorage.getItem('userRole'))) && (
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-[#2c3e50] mb-2 uppercase tracking-wider text-xs">Technical Details</h3>
                            <div className="bg-gray-50 rounded-lg border border-gray-100 divide-y divide-gray-100">
                                <SpecRow label="Serial Number" value={equipment.serialNumber} />
                                <SpecRow label="Asset Tag" value={equipment.assetTag} />
                                <SpecRow label="Department" value={equipment.department} />
                                <SpecRow label="Warranty" value={equipment.warrantyExpiry} />
                                <SpecRow label="Maintenance Required" value={equipment.requiresMaintenance ? 'Yes' : 'No'} highlight={equipment.requiresMaintenance} />
                                {readOnly && (
                                    <>
                                        <SpecRow label="Supplier" value={equipment.supplier} />
                                        <SpecRow label="Location" value={equipment.location} />
                                    </>
                                )}
                            </div>
                        </div>
                      )}

                      {/* Borrowing Guidance - FOR STUDENTS */}
                      {!readOnly && equipment.status === 'Available' && (
                          <div className="mb-6 pt-6 border-t border-gray-100 space-y-4">
                              <h3 className="text-sm font-bold text-[#2c3e50] uppercase tracking-wider text-xs">Access Authorization</h3>
                              {localStorage.getItem('token') ? (
                                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                                      <Info className="text-blue-500 shrink-0" size={18} />
                                      <p className="text-xs text-blue-800 leading-relaxed font-medium">
                                          This item requires a formal application including your student credentials and ID verification. Click below to start your request.
                                      </p>
                                  </div>
                              ) : (
                                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                                      <p className="text-xs text-orange-800 font-medium">
                                          Please <Link to="/login" className="font-bold underline">Login</Link> to apply for this equipment.
                                      </p>
                                  </div>
                              )}
                          </div>
                      )}

                      {/* Manual Download */}
                      {equipment.manualUrl && (
                          <div className="mb-6">
                             <a 
                                  href={equipment.manualUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="block p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors group"
                              >
                                  <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                          <div className="p-2 bg-white rounded-md text-[#1f4fa3]">
                                              <Download size={18} />
                                          </div>
                                          <div>
                                              <h4 className="text-sm font-bold text-[#1f4fa3] group-hover:underline">Download Manual</h4>
                                              <p className="text-xs text-[#6b7280]">PDF Documentation</p>
                                          </div>
                                      </div>
                                      <ChevronRight size={16} className="text-[#1f4fa3]" />
                                  </div>
                             </a>
                          </div>
                      )}

                      {/* Action Button */}
                      {!readOnly && (
                          <div className="mt-auto pt-6 border-t border-gray-100">
                                  <button
                                     onClick={handleRequestInit}
                                     disabled={equipment.status !== 'Available'}
                                     className={`w-full py-3.5 rounded-lg text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                                        equipment.status === 'Available' 
                                           ? 'bg-[#1f4fa3] text-white hover:bg-[#173e82] shadow-blue-900/20' 
                                           : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                     }`}
                                  >
                                      {equipment.status === 'Available' ? (
                                          <><Calendar size={18} /> Apply for Borrowing</>
                                      ) : (
                                          <><AlertCircle size={18} /> Currently Unavailable</>
                                      )}
                                  </button>
                              <p className="text-center text-xs text-gray-400 mt-3">
                                 By requesting this item, you agree to the safety guidelines.
                              </p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
        </motion.div>
      </div>

      {requestModalOpen && (
          <RequestFormModal 
              isOpen={requestModalOpen} 
              onClose={() => setRequestModalOpen(false)} 
              item={equipment} 
          />
      )}
    </AnimatePresence>
  );
};

const SpecRow = ({ label, value, highlight }) => (
    <div className="flex justify-between p-3 first:rounded-t-lg last:rounded-b-lg hover:bg-white transition-colors">
        <span className="text-xs font-medium text-[#9ca3af]">{label}</span>
        <span className={`text-xs font-semibold ${highlight ? 'text-amber-600' : 'text-[#2c3e50]'}`}>{value || '—'}</span>
    </div>
);

export default EquipmentDetailsModal;

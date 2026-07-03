import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Briefcase, ChevronRight, Loader2, BadgeCheck, AlertCircle } from "lucide-react";
import API_BASE_URL from '../config/api';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Form States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Student");
  const [department, setDepartment] = useState("");
  const [studentId, setStudentId] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const payload = isLogin 
      ? { email, password }
      : { fullName, email, password, role, department, studentId };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      // Store in LocalStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userRole", data.user.role); // Important for App.jsx routing

      // Redirect to dashboard
      navigate('/dashboard');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex overflow-hidden min-h-[600px]">
        
        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8">
             <Link to="/" className="flex items-center gap-2 mb-2 group">
                <div className="w-8 h-8 bg-[#1f4fa3] rounded-md flex items-center justify-center group-hover:scale-105 transition-transform">
                   <Briefcase size={18} className="text-white" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-[#1f4fa3] uppercase leading-none">Smart <span className="text-[#60a5fa]">Uni</span></h1>
             </Link>
             <h2 className="text-2xl font-bold text-[#2c3e50]">{isLogin ? "Welcome Back" : "Create Account"}</h2>
             <p className="text-sm text-[#6b7280] mt-1">
                {isLogin ? "Enter your credentials to access your account." : "Join the university platform today."}
             </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 text-red-600 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {isLogin && (
            <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-3" aria-label="Presentation accounts">
              <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700">Presentation sign-in</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  ['Student', 'student@uniguide.rw'],
                  ['Lab Staff', 'labstaff@uniguide.rw'],
                  ['Admin', 'admin@uniguide.rw'],
                ].map(([label, account]) => (
                  <button key={label} type="button" onClick={() => { setEmail(account); setPassword('password123'); }} className="rounded-md border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100">
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
             {!isLogin && (
                <>
                   <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[#6b7280]">Full Name</label>
                      <div className="relative group">
                         <input 
                            type="text" 
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. Alice Johnson"
                            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm text-[#2c3e50] focus:outline-none focus:border-[#1f4fa3] focus:ring-1 focus:ring-[#1f4fa3]/20 transition-all"
                         />
                         <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1f4fa3] transition-colors" />
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                         <label className="block text-xs font-medium text-[#6b7280]">Role</label>
                         <select 
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm text-[#2c3e50] focus:outline-none focus:border-[#1f4fa3] focus:ring-1 focus:ring-[#1f4fa3]/20 transition-all cursor-pointer appearance-none"
                         >
                            <option value="Student">Student</option>
                            <option value="Lecturer">Lecturer</option>
                         </select>
                      </div>
                      <div className="space-y-1.5">
                         <label className="block text-xs font-medium text-[#6b7280]">ID Number</label>
                         <div className="relative group">
                            <input 
                               type="text" 
                               value={studentId}
                               onChange={(e) => setStudentId(e.target.value)}
                               placeholder="e.g. 20248492"
                               className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm text-[#2c3e50] focus:outline-none focus:border-[#1f4fa3] focus:ring-1 focus:ring-[#1f4fa3]/20 transition-all"
                            />
                            <BadgeCheck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1f4fa3] transition-colors" />
                         </div>
                      </div>
                   </div>
                </>
             )}

             <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#6b7280]">Email Address</label>
                <div className="relative group">
                   <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@uni.edu"
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm text-[#2c3e50] focus:outline-none focus:border-[#1f4fa3] focus:ring-1 focus:ring-[#1f4fa3]/20 transition-all"
                   />
                   <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1f4fa3] transition-colors" />
                </div>
             </div>

             <div className="space-y-1.5">
                <div className="flex justify-between">
                   <label className="block text-xs font-medium text-[#6b7280]">Password</label>
                   {isLogin && <a href="#" className="text-xs text-[#1f4fa3] font-medium hover:underline">Forgot password?</a>}
                </div>
                <div className="relative group">
                   <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm text-[#2c3e50] focus:outline-none focus:border-[#1f4fa3] focus:ring-1 focus:ring-[#1f4fa3]/20 transition-all"
                   />
                   <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1f4fa3] transition-colors" />
                </div>
             </div>

             {!isLogin && (
                <div className="space-y-1.5">
                   <label className="block text-xs font-medium text-[#6b7280]">Department</label>
                   <select 
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm text-[#2c3e50] focus:outline-none focus:border-[#1f4fa3] focus:ring-1 focus:ring-[#1f4fa3]/20 transition-all cursor-pointer appearance-none"
                   >
                      <option value="">Select Department...</option>
                      <option value="Renewable Energy">Renewable Energy</option>
                      <option value="Mechatronic">Mechatronic</option>
                      <option value="ICT">ICT</option>
                      <option value="Electronic and Telecommunication">Electronic and Telecommunication</option>
                   </select>
                </div>
             )}

             <button 
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#1f4fa3] text-white rounded-md text-sm font-semibold hover:bg-[#173e82] transition-colors shadow-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
             >
                {loading ? <Loader2 size={18} className="animate-spin" /> : (isLogin ? "Sign In" : "Create Account")}
                {!loading && <ChevronRight size={16} />}
             </button>
          </form>

          <div className="mt-6 text-center">
             <p className="text-xs text-[#6b7280]">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                   onClick={() => setIsLogin(!isLogin)} 
                   className="text-[#1f4fa3] font-bold hover:underline"
                >
                   {isLogin ? "Register here" : "Login here"}
                </button>
             </p>
          </div>
        </div>

        {/* Right Side - Visual */}
        <div className="hidden md:flex md:w-1/2 bg-[#1f4fa3] relative overflow-hidden items-center justify-center p-12 text-white">
           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
           <div className="relative z-10 max-w-sm">
              <h3 className="text-3xl font-bold mb-4">Laboratory Management System</h3>
              <p className="text-blue-100 text-sm leading-relaxed mb-6">
                 Streamline equipment borrowing, manage reservations, and access equipment guides all in one place.
              </p>
              
              <div className="space-y-4">
                 <FeatureItem text="Real-time equipment tracking" />
                 <FeatureItem text="Seamless reservation process" />
                 <FeatureItem text="Comprehensive resource library" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ text }) => (
   <div className="flex items-center gap-3">
      <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
         <ChevronRight size={12} />
      </div>
      <span className="text-sm font-medium">{text}</span>
   </div>
);

export default Login;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Check, LayoutGrid, Bell, Users, TrendingUp } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  function validate() {
    if (!email || !password) {
      setError("Email and password are required.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return false;
    }
    setError("");
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError("");

    try {
      const response = await loginUser(email, password);
      const { token, user } = response.data;
      login(token, user);
      if (user.mustResetPassword) {
        navigate("/reset-password");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      const message = err.response?.data?.message || "Login failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex font-sans">
      
      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-[60%] xl:w-[65%] bg-[#1a1f26] flex-col justify-center px-16 xl:px-32 py-12 text-white">
        
        <div className="max-w-[540px]">
          {/* Logo */}
          <div className="w-[52px] h-[52px] bg-white rounded-[14px] flex items-center justify-center mb-6">
            <Check size={26} className="text-[#1a1f26]" strokeWidth={2.5} />
          </div>

          <h1 className="text-[36px] font-medium tracking-tight mb-3 text-white">TaskHub</h1>
          <p className="text-[15px] text-[#8b949e] leading-relaxed mb-12 max-w-[400px]">
            Manage your tasks efficiently and collaborate with your team seamlessly.
          </p>

          {/* Features List */}
          <div className="space-y-7">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#2d333b] flex items-center justify-center shrink-0">
                <LayoutGrid size={18} className="text-[#8b949e]" />
              </div>
              <div className="mt-0.5">
                <h3 className="text-[14px] font-semibold text-white mb-0.5">Kanban Task Board</h3>
                <p className="text-[13px] text-[#8b949e]">Visual workflow management</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#2d333b] flex items-center justify-center shrink-0">
                <Bell size={18} className="text-[#8b949e]" />
              </div>
              <div className="mt-0.5">
                <h3 className="text-[14px] font-semibold text-white mb-0.5">Real-time Notifications</h3>
                <p className="text-[13px] text-[#8b949e]">Stay updated instantly</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#2d333b] flex items-center justify-center shrink-0">
                <Users size={18} className="text-[#8b949e]" />
              </div>
              <div className="mt-0.5">
                <h3 className="text-[14px] font-semibold text-white mb-0.5">Team Collaboration</h3>
                <p className="text-[13px] text-[#8b949e]">Work together seamlessly</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#2d333b] flex items-center justify-center shrink-0">
                <TrendingUp size={18} className="text-[#8b949e]" />
              </div>
              <div className="mt-0.5">
                <h3 className="text-[14px] font-semibold text-white mb-0.5">Progress Tracking</h3>
                <p className="text-[13px] text-[#8b949e]">Monitor team performance</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[40%] xl:w-[35%] bg-white flex items-center justify-center p-8">
        
        {/* Floating Card */}
        <div className="w-full max-w-[420px] bg-white rounded-xl border border-gray-100 shadow-[0_2px_20px_rgb(0,0,0,0.04)] p-10">
          
          <h2 className="text-[32px] font-normal text-gray-900 mb-2 tracking-tight">Welcome back</h2>
          <p className="text-[14px] text-gray-500 mb-10">Sign in to your TaskHub account</p>

          <form onSubmit={handleSubmit} noValidate>
            
            <div className="mb-6">
              <label className="block text-[13px] font-medium text-gray-700 mb-2.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@test.com"
                className="w-full bg-[#edf2f7] border border-transparent rounded-[8px] px-4 py-3 text-[14px] text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#c5d3e0] transition-colors"
              />
            </div>

            <div className="mb-8 relative">
              <label className="block text-[13px] font-medium text-gray-700 mb-2.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#edf2f7] border border-transparent rounded-[8px] pl-4 pr-10 py-3 text-[14px] text-gray-900 placeholder-gray-500 tracking-widest focus:outline-none focus:bg-white focus:border-[#c5d3e0] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-[13px] rounded-lg px-4 py-3 mb-6 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a1f26] hover:bg-[#111418] disabled:opacity-50 text-white text-[15px] font-medium rounded-[8px] py-3 transition-colors"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-[12px] text-gray-500">
              Don't have an account? Contact your<br />administrator.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
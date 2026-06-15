import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { productionAPI } from '../services/api';
import botivateLogoB from '../Assets/logo.png';
import Footer from '../components/Footer';

const Login = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const result = await productionAPI.getSheetData('Login', { headerRow: 1 });
      if (!result.success || !result.records) {
        toast.error('Could not fetch user credentials from sheet');
        setSubmitting(false);
        return;
      }

      const records = result.records;
      const matchedRecord = records.find((r) => {
        const rowUser = (r.username || r.userName || r.__rowValues?.[1] || '').toString().trim();
        const rowPass = (r.password || r.__rowValues?.[2] || '').toString().trim();
        return rowUser.toLowerCase() === id.trim().toLowerCase() && rowPass === password;
      });

      if (!matchedRecord) {
        toast.error('Invalid credentials');
        setSubmitting(false);
        return;
      }

      const matchedUser = {
        id: (matchedRecord.username || matchedRecord.userName || matchedRecord.__rowValues?.[1] || '').toString().trim(),
        name: (matchedRecord['full-Name'] || matchedRecord['Full-Name'] || matchedRecord.fullName || matchedRecord.fullname || matchedRecord.__rowValues?.[0] || '').toString().trim(),
        password: (matchedRecord.password || matchedRecord.__rowValues?.[2] || '').toString().trim(),
        role: (matchedRecord.role || matchedRecord.__rowValues?.[3] || 'USER').toString().trim()
      };

      toast.success('Login successful!');
      login(matchedUser);
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error('Login error');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-sky-50 to-sky-100">
      {/* Center Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 space-y-4">
          
          {/* Logo Section */}
          <div className="flex flex-col items-center space-y-3">
            <div className="w-20 h-20 rounded-full border-2 border-sky-400 flex items-center justify-center shadow-lg bg-transparent">
              <img
                src={botivateLogoB}
                alt="Ace Mark Logo"
                className="w-16 h-16 object-contain"
              />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Ace Mark</h1>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-3" onSubmit={handleSubmit}>
            {/* User ID Input */}
            <div className="space-y-1">
              <label htmlFor="id" className="text-xs font-semibold text-gray-700">
                User ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="id"
                  name="id"
                  type="text"
                  required
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className="block w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-950 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all text-sm"
                  placeholder="Enter user ID"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label htmlFor="password" className="text-xs font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-950 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all text-sm"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-2 px-4 text-sm font-bold bg-sky-600 text-white rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-600 transition-all ${
                submitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer at Bottom */}
      <Footer />
    </div>
  );
};

export default Login;


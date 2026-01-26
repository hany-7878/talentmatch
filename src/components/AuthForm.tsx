import { useState } from 'react';
import { FaUserTie, FaUser, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom'; 
import { supabase } from '../lib/supabaseClient'; 

type Role = 'seeker' | 'manager';

export default function AuthForm() {
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true); // Default to login for better UX
  const [role, setRole] = useState<Role>('seeker');
  const [showPolicy, setShowPolicy] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '', 
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePassword = (pw: string) => {
    const regex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    return regex.test(pw);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isLogin) {
        // --- 1. LOGIN ---
        const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (loginError) throw loginError;

        if (authData?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authData.user.id)
            .maybeSingle();

          if (profileError) console.error("Profile fetch error:", profileError);

          // Redirect everyone to the master /dashboard
          // The Dashboard component logic will handle showing the right view
          navigate('/dashboard');
        }
      } else {
        // --- 2. REGISTER ---
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match!');
        }
        if (!validatePassword(formData.password)) {
          throw new Error('Password: 8+ chars, must include letters, numbers, and symbols.');
        }

        const supabaseRole = role.toUpperCase(); 

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              role: supabaseRole, 
              full_name: formData.fullName, 
            }
          }
        });

        if (signUpError) throw signUpError;

        if (signUpData.user && signUpData.session) {
            // Auto-login success - send to unified dashboard
            navigate('/dashboard');
        } else {
            alert("Success! Check your email for a confirmation link.");
            setIsLogin(true);
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <div className="relative flex flex-col justify-center h-full p-4 w-full md:w-1/2 overflow-hidden bg-white">
      <div className="max-w-md mx-auto w-full">
        <h2 className="text-3xl font-bold mb-2 text-gray-900 text-center md:text-left">
          {isLogin ? 'Welcome back' : 'Create an account'}
        </h2>
        <p className="text-gray-600 mb-6 text-center md:text-left">
          {isLogin ? 'Enter your details to sign in' : 'Join the TalentMatch community'}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg animate-shake">
            {error}
          </div>
        )}

        {!isLogin && (
          <div className="flex gap-4 mb-8">
            {[
              { id: 'seeker', label: 'Job Seeker', icon: <FaUser /> },
              { id: 'manager', label: 'Hiring Manager', icon: <FaUserTie /> }
            ].map((type) => (
              <button
                key={type.id}
                type="button"
                title={`Select ${type.label} role`}
                onClick={() => setRole(type.id as Role)}
                className={`flex-1 flex flex-col items-center gap-2 p-4 border-2 rounded-xl transition-all ${
                  role === type.id 
                    ? 'border-blue-500 bg-blue-50 text-blue-600 ring-2 ring-blue-100' 
                    : 'border-gray-200 hover:border-blue-200 text-gray-500'
                }`}
              >
                <span className="text-2xl">{type.icon}</span>
                <span className="font-medium text-xs md:text-sm">{type.label}</span>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                name="fullName"
                type="text"
                required
                disabled={isLoading}
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all disabled:bg-gray-50"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input
              name="email"
              type="email"
              required
              disabled={isLoading}
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all disabled:bg-gray-50"
            />
          </div>

          <div className={`grid ${isLogin ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                name="password"
                type="password"
                required
                disabled={isLoading}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all disabled:bg-gray-50"
              />
            </div>
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm</label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  disabled={isLoading}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all disabled:bg-gray-50"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`mt-4 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-all shadow-md font-bold flex justify-center items-center ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </span>
            ) : (
              isLogin ? 'Sign In' : 'Get Started'
            )}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-6 text-center">
          {isLogin ? "New to TalentMatch?" : "Already a member?"}{' '}
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 font-semibold hover:underline"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>

        {/* Footer Link for Policy */}
        <button 
          onClick={() => setShowPolicy(true)}
          className="mt-8 text-[10px] text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors mx-auto block"
        >
          View Privacy & Terms
        </button>
      </div>

      {/* Policy Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 md:w-96 bg-white shadow-2xl z-50 p-8 transform transition-transform duration-300 ease-in-out ${
          showPolicy ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Legal Info</h2>
          <button 
            onClick={() => setShowPolicy(false)} 
            title="Close Policy"
            aria-label="Close Policy" 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaTimes />
          </button>
        </div>
        <div className="text-gray-600 text-sm overflow-y-auto h-[85%] pr-2">
           <h3 className="font-bold mb-2">Terms of Service</h3>
           <p className="mb-4 text-xs leading-relaxed">By using TalentMatch, you agree to our standard operating procedures for talent matching and recruitment.</p>
           <h3 className="font-bold mb-2">Privacy Policy</h3>
           <p className="text-xs leading-relaxed">Your data is secured using Supabase Row Level Security. We never share your credentials.</p>
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { FaUserTie, FaUser, FaTimes } from 'react-icons/fa';

export default function AuthForm() {
  const [role, setRole] = useState<'seeker' | 'manager'>('seeker');
  const [showPolicy, setShowPolicy] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    console.log("Registering as:", role, formData);
  };

  return (
    <div className="relative flex flex-col justify-center h-full p-4 w-full md:w-1/2 overflow-hidden">
      <div className="max-w-md mx-auto w-full">
        <h2 className="text-3xl font-bold mb-2">Create an account</h2>
        <p className="text-gray-600 mb-8">Choose your role to get started</p>

        {/* Role selection */}
        <div className="flex gap-4 mb-8">
          {[
            { id: 'seeker', label: 'Job Seeker', icon: <FaUser /> },
            { id: 'manager', label: 'Hiring Manager', icon: <FaUserTie /> }
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setRole(type.id as any)}
              className={`flex-1 flex flex-col items-center gap-2 p-4 border-2 rounded-xl transition-all ${
                role === type.id 
                  ? 'border-blue-500 bg-blue-50 text-blue-600 ring-2 ring-blue-100' 
                  : 'border-gray-200 hover:border-blue-200 text-gray-500'
              }`}
            >
              <span className="text-2xl">{type.icon}</span>
              <span className="font-medium">{type.label}</span>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input
              name="email"
              type="email"
              required
              onChange={handleChange}
              placeholder="name@example.com"
              className="w-full border px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                name="password"
                type="password"
                required
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full border px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm</label>
              <input
                name="confirmPassword"
                type="password"
                required
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full border px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-shadow shadow-md hover:shadow-lg font-bold"
          >
            Create Account
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-6 text-center">
          Already have an account?{' '}
          <button className="text-blue-600 font-semibold hover:underline">Log in</button>
        </p>

        <div className="mt-8 text-[11px] text-gray-400 text-center leading-relaxed">
          By clicking continue, you agree to our{' '}
          <span
            onClick={() => setShowPolicy(true)}
            className="text-blue-500 underline cursor-pointer"
          >
            Terms of Service
          </span>{' '}
          &{' '}
          <span
            onClick={() => setShowPolicy(true)}
            className="text-blue-500 underline cursor-pointer"
          >
            Privacy Policy
          </span>
        </div>
      </div>

      {/* Side Panel with basic CSS transition logic */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 md:w-96 bg-white shadow-2xl z-50 p-8 transform transition-transform duration-300 ease-in-out ${
          showPolicy ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Legal Information</h2>
          <button onClick={() => setShowPolicy(false)} className="p-2 hover:bg-gray-100 rounded-full">
            <FaTimes className="text-gray-500" />
          </button>
        </div>
        <div className="text-gray-600 text-sm h-[calc(100%-80px)] overflow-y-auto pr-2">
           <h3 className="font-bold mb-2">1. Terms of Service</h3>
           <p className="mb-4">Details about usage rights and user obligations...</p>
           <h3 className="font-bold mb-2">2. Privacy Policy</h3>
           <p>Details about how we handle your data...</p>
        </div>
      </div>

      {/* Overlay */}
      {showPolicy && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setShowPolicy(false)}
        ></div>
      )}
    </div>
  );
}
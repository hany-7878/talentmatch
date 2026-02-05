import { Routes, Route, Navigate} from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/Landing';
import AuthForm from './components/AuthForm';
import Dashboard from './pages/Dashboard';
import { Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import InstallBanner from './components/InstallBanner'; 
const FullPageLoader = () => (
  <div className="h-dvh bg-slate-50 flex items-center justify-center p-safe-top p-safe-bottom">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-indigo-100 rounded-full"></div>
        <div className="absolute top-0 w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">TalentMatch</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullPageLoader />;
  if (!user) return <Navigate to="/" replace />; 
  return <>{children}</>;
};

function App() {
  const { user } = useAuth();

  return (
    <div className="safe-h-screen overscroll-contain selection:bg-indigo-100">
      <Toaster 
        position="top-center" 
        toastOptions={{
          className: 'rounded-2xl font-bold text-sm shadow-2xl border border-gray-100',
          duration: 3000,
        }} 
      />
      
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route path="/auth" element={!user ? <AuthForm /> : <Navigate to="/dashboard" replace />} />
        
        <Route 
          path="/dashboard/*" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

    
        <Route path="/manager-dashboard" element={<Navigate to="/dashboard" replace />} />
        <Route path="/seeker-dashboard" element={<Navigate to="/dashboard" replace />} />

        <Route path="*" element={
          <div className="h-dvh flex items-center justify-center p-6 text-center">
            <div>
              <h1 className="text-6xl font-black text-slate-200 mb-4 tracking-tighter">404</h1>
              <p className="text-slate-500 font-medium mb-6">This page doesn't exist.</p>
              <Link to="/" className="inline-block bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-transform">
                Go Back
              </Link>
            </div>
          </div>
        } />
      </Routes>

      <InstallBanner />
    </div>
  );
}

export default App;
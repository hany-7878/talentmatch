import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/Landing';
import AuthForm from './components/AuthForm';
import Dashboard from './pages/Dashboard';
import { Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 font-medium">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  
  return <>{children}</>;
};

function App() {
  return (
    <> 
    <Toaster position="top-right" reverseOrder={false} />
    <Routes>
      
      <Route path="/" element={<LandingPage />} />
      <Route path="/" element={<AuthForm />} />
      
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />

      {/* Redirect old routes to the unified dashboard */}
      <Route path="/manager-dashboard" element={<Navigate to="/dashboard" replace />} />
      <Route path="/seeker-dashboard" element={<Navigate to="/dashboard" replace />} />

      <Route path="*" element={
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
            <p className="text-gray-600 mb-4">Page Not Found</p>
            <Link to="/" className="text-blue-600 hover:underline">Return Home</Link>
          </div>
        </div>
      } />
    </Routes>
    </>
  );
}

export default App;
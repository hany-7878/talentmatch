import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/Landing';
import AuthForm from './components/AuthForm';
import Dashboard from './pages/Dashboard';

// Simple wrapper to protect private routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  
  return <>{children}</>;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthForm />} />
      
      {/* Both Roles now use this single Route */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />

      {/* Redirect /manager-dashboard to /dashboard if needed for backward compatibility */}
      <Route path="/manager-dashboard" element={<Navigate to="/dashboard" replace />} />

      <Route path="*" element={<div className="p-10 text-center">404 - Page Not Found</div>} />
    </Routes>
  );
}

export default App;
// App.tsx
import LandingPage from './pages/Landing'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <LandingPage />
    </AuthProvider>
  )
}

export default App

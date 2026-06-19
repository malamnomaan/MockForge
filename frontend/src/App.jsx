import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Public Pages
import Landing from './pages/Landing';
import Pricing from './pages/Pricing';
import About from './pages/About';
import Career from './pages/Career';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

// Auth Layout & Pages
import ProtectedRoute from './components/layout/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/app/Dashboard';
import ExamSetup from './pages/app/ExamSetup';
import InterviewWorkspace from './pages/app/InterviewWorkspace';
import SessionDetail from './pages/app/SessionDetail';
import Profile from './pages/app/Profile';

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '80px' }}>
        {children}
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
        <Route path="/pricing" element={<PublicLayout><Pricing /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
        <Route path="/career" element={<PublicLayout><Career /></PublicLayout>} />
        <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
        <Route path="/signup" element={<PublicLayout><Signup /></PublicLayout>} />
        
        {/* Protected App Routes */}
        <Route path="/app" element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="setup" element={<ExamSetup />} />
            <Route path="interviews" element={<Navigate to="/app" />} /> {/* Replace with list page later */}
            <Route path="session/:id" element={<SessionDetail />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          
          {/* Exam Mode: Full screen without sidebar */}
          <Route path="interview/:id" element={
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: '2rem', background: 'var(--bg-primary)', boxSizing: 'border-box', overflow: 'hidden' }}>
              <InterviewWorkspace />
            </div>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

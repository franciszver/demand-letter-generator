import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import Editor from './pages/Editor';
import Login from './pages/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import ContentManagement from './pages/Admin/ContentManagement';
import Analytics from './pages/Admin/Analytics';
import SystemHealth from './pages/Admin/SystemHealth';
import UserManagement from './pages/Admin/UserManagement';
import Webhooks from './pages/Admin/Webhooks';
import PromptManagement from './pages/Admin/PromptManagement';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Settings from './pages/Settings';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-steno-gray-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Home />} />
              <Route path="/editor/:draftId?" element={<Editor />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/content" element={<ContentManagement />} />
              <Route path="/admin/analytics" element={<Analytics />} />
              <Route path="/admin/health" element={<SystemHealth />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/webhooks" element={<Webhooks />} />
              <Route path="/admin/prompts" element={<PromptManagement />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <ToastContainer position="top-right" autoClose={3000} />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;


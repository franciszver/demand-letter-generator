import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if user is admin (client-side check, backend also validates)
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-steno-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-heading font-bold text-steno-navy mb-2">Access Denied</h2>
          <p className="text-steno-charcoal-light mb-4">You must be an administrator to access this area.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-steno-navy text-white rounded-lg hover:bg-steno-navy-dark font-medium transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/content', label: 'Content Management', icon: '📄' },
    { path: '/admin/analytics', label: 'Analytics', icon: '📈' },
    { path: '/admin/health', label: 'System Health', icon: '🏥' },
    { path: '/admin/users', label: 'User Management', icon: '👥' },
    { path: '/admin/webhooks', label: 'Webhooks', icon: '🔗' },
    { path: '/admin/prompts', label: 'AI Prompts', icon: '🤖' },
  ];

  return (
    <div className="min-h-screen bg-steno-gray-50">
      {/* Admin Header */}
      <nav className="bg-white shadow-sm border-b border-steno-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-heading font-bold text-steno-navy">Steno Draft Admin</h1>
              <span className="text-xs text-steno-teal font-medium">Administrative Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="text-steno-teal hover:text-steno-teal-dark font-medium transition-colors"
              >
                ← Back to Application
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-4">
              <ul className="space-y-2">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path || 
                    (item.path !== '/admin' && location.pathname.startsWith(item.path));
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-steno-navy text-white font-medium'
                            : 'text-steno-charcoal hover:bg-steno-gray-100'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;


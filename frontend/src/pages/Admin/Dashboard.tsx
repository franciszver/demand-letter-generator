import React from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';

const Dashboard: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-steno-navy mb-2">Admin Dashboard</h1>
          <p className="text-steno-charcoal-light">
            Manage your firm's Steno Draft platform, view analytics, and configure settings.
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/content"
            className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📄</span>
              <h3 className="text-lg font-heading font-semibold text-steno-navy">Content</h3>
            </div>
            <p className="text-sm text-steno-charcoal-light">Manage templates and drafts</p>
          </Link>

          <Link
            to="/admin/analytics"
            className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📈</span>
              <h3 className="text-lg font-heading font-semibold text-steno-navy">Analytics</h3>
            </div>
            <p className="text-sm text-steno-charcoal-light">View usage and performance metrics</p>
          </Link>

          <Link
            to="/admin/health"
            className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🏥</span>
              <h3 className="text-lg font-heading font-semibold text-steno-navy">System Health</h3>
            </div>
            <p className="text-sm text-steno-charcoal-light">Monitor system status</p>
          </Link>

          <Link
            to="/admin/users"
            className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">👥</span>
              <h3 className="text-lg font-heading font-semibold text-steno-navy">Users</h3>
            </div>
            <p className="text-sm text-steno-charcoal-light">Manage user accounts</p>
          </Link>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-6">
          <h2 className="text-xl font-heading font-semibold text-steno-navy mb-4">Recent Activity</h2>
          <p className="text-steno-charcoal-light">Activity feed will be displayed here once analytics are implemented.</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;


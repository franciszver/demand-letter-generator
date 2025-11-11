import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import AdminMetrics from '../components/AdminMetrics';
import TimeSavedWidget from '../components/TimeSavedWidget';
import { toast } from 'react-toastify';

interface AdminMetricsData {
  totalUsers: number;
  totalLetters: number;
  totalDocuments: number;
  totalTimeSaved: number;
  averageTimeSaved: number;
  lettersGeneratedToday: number;
  lettersGeneratedThisWeek: number;
  lettersGeneratedThisMonth: number;
  activeUsers: number;
  userActivity: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    lettersGenerated: number;
    timeSaved: number;
  }>;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<AdminMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user] = useState(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast.error('Admin access required');
      navigate('/');
      return;
    }

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/metrics');
        if (response.data.success) {
          setMetrics(response.data.data);
        }
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to load admin metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">Failed to load metrics</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">System-wide metrics and analytics</p>
      </div>

      <AdminMetrics {...metrics} />

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Time Saved Overview</h2>
        <TimeSavedWidget />
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">User Activity</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Letters Generated</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Saved</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.userActivity.map((activity) => (
                <tr key={activity.userId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {activity.userName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {activity.userEmail}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {activity.lettersGenerated}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Math.floor(activity.timeSaved / 60)}h {activity.timeSaved % 60}m
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;


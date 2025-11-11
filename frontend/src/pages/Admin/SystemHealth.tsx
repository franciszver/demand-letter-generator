import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { toast } from 'react-toastify';
import AdminLayout from '../../components/AdminLayout';
import { LoadingSpinner } from '../../components/LoadingStates';

interface HealthData {
  status: string;
  database: {
    status: string;
    responseTime: number;
  };
  system: {
    uptime: number;
    uptimeFormatted: string;
  };
  metrics: {
    activeSessions: number;
    recentErrors: number;
  };
  timestamp: string;
}

const SystemHealth: React.FC = () => {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadHealth = async () => {
    try {
      const response = await api.get<{ success: boolean; data: HealthData }>('/admin/health');
      if (response.data.success && response.data.data) {
        setData(response.data.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to load system health');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner size="lg" text="Loading system health..." />
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <p className="text-steno-charcoal-light">No health data available.</p>
        </div>
      </AdminLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'operational':
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-steno-gray-600 bg-steno-gray-100';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-steno-navy mb-2">System Health</h1>
          <p className="text-steno-charcoal-light">
            Monitor system status, database performance, and active sessions.
          </p>
        </div>

        {/* Overall Status */}
        <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-heading font-semibold text-steno-navy mb-2">Overall Status</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(data.status)}`}>
                {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm text-steno-charcoal-light">Last Updated</div>
              <div className="text-steno-charcoal">{new Date(data.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-6">
            <div className="text-sm text-steno-charcoal-light mb-1">Database Status</div>
            <div className="text-2xl font-heading font-bold text-steno-navy mb-1">
              <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(data.database.status)}`}>
                {data.database.status}
              </span>
            </div>
            <div className="text-xs text-steno-charcoal-light">Response: {data.database.responseTime}ms</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-6">
            <div className="text-sm text-steno-charcoal-light mb-1">System Uptime</div>
            <div className="text-2xl font-heading font-bold text-steno-teal">{data.system.uptimeFormatted}</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-6">
            <div className="text-sm text-steno-charcoal-light mb-1">Active Sessions</div>
            <div className="text-2xl font-heading font-bold text-steno-navy">{data.metrics.activeSessions}</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-6">
            <div className="text-sm text-steno-charcoal-light mb-1">Recent Errors</div>
            <div className="text-2xl font-heading font-bold text-steno-navy">{data.metrics.recentErrors}</div>
          </div>
        </div>

        {/* Health Details */}
        <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-6">
          <h2 className="text-xl font-heading font-semibold text-steno-navy mb-4">Health Details</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-steno-gray-200">
              <span className="text-steno-charcoal">Database Connection</span>
              <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(data.database.status)}`}>
                {data.database.status}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-steno-gray-200">
              <span className="text-steno-charcoal">Database Response Time</span>
              <span className="text-steno-charcoal-light">{data.database.responseTime}ms</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-steno-gray-200">
              <span className="text-steno-charcoal">System Uptime</span>
              <span className="text-steno-charcoal-light">{data.system.uptimeFormatted}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-steno-charcoal">Active Collaboration Sessions</span>
              <span className="text-steno-charcoal-light">{data.metrics.activeSessions}</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SystemHealth;


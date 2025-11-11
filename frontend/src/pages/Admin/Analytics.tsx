import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { toast } from 'react-toastify';
import AdminLayout from '../../components/AdminLayout';
import { LoadingSpinner } from '../../components/LoadingStates';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsData {
  summary: {
    totalUsers: number;
    activeUsers: number;
    totalDrafts: number;
    totalTemplates: number;
    lettersGenerated: number;
    lettersExported: number;
    lettersRefined: number;
    timeSavedHours: number;
    estimatedROI: number;
  };
  dailyGenerations: Array<{ date: string; count: number }>;
  eventCounts: Record<string, number>;
  templateUsage: Record<string, number>;
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
}

const COLORS = ['#1e3a5f', '#0d9488', '#2d3748', '#d4af37', '#c0c0c0'];

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadAnalytics();
  }, [days]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await api.get<{ success: boolean; data: AnalyticsData }>(`/admin/analytics?days=${days}`);
      if (response.data.success && response.data.data) {
        setData(response.data.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner size="lg" text="Loading analytics..." />
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <p className="text-steno-charcoal-light">No analytics data available.</p>
        </div>
      </AdminLayout>
    );
  }

  // Prepare chart data
  const dailyData = data.dailyGenerations.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: item.count,
  }));

  const eventData = Object.entries(data.eventCounts).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value,
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-heading font-bold text-steno-navy mb-2">Analytics Dashboard</h1>
            <p className="text-steno-charcoal-light">
              Usage metrics, time savings, and ROI calculations for your firm.
            </p>
          </div>
          <div>
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value, 10))}
              className="px-4 py-2 border border-steno-gray-300 rounded-lg focus:ring-steno-teal focus:border-steno-teal"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-6">
            <div className="text-sm text-steno-charcoal-light mb-1">Letters Generated</div>
            <div className="text-3xl font-heading font-bold text-steno-navy">{data.summary.lettersGenerated}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-6">
            <div className="text-sm text-steno-charcoal-light mb-1">Time Saved</div>
            <div className="text-3xl font-heading font-bold text-steno-teal">{data.summary.timeSavedHours.toLocaleString()} hrs</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-6">
            <div className="text-sm text-steno-charcoal-light mb-1">Estimated ROI</div>
            <div className="text-3xl font-heading font-bold text-steno-navy">${data.summary.estimatedROI.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-6">
            <div className="text-sm text-steno-charcoal-light mb-1">Active Users</div>
            <div className="text-3xl font-heading font-bold text-steno-teal">{data.summary.activeUsers}</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Generations Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-6">
            <h2 className="text-xl font-heading font-semibold text-steno-navy mb-4">Letter Generation Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={2} name="Letters Generated" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Event Counts Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-6">
            <h2 className="text-xl font-heading font-semibold text-steno-navy mb-4">Activity Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eventData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="value" fill="#0d9488" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-6">
            <div className="text-sm text-steno-charcoal-light mb-2">Total Users</div>
            <div className="text-2xl font-heading font-bold text-steno-navy">{data.summary.totalUsers}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-6">
            <div className="text-sm text-steno-charcoal-light mb-2">Total Drafts</div>
            <div className="text-2xl font-heading font-bold text-steno-navy">{data.summary.totalDrafts}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-6">
            <div className="text-sm text-steno-charcoal-light mb-2">Total Templates</div>
            <div className="text-2xl font-heading font-bold text-steno-navy">{data.summary.totalTemplates}</div>
          </div>
        </div>

        {/* ROI Details */}
        <div className="bg-gradient-to-r from-steno-teal/10 to-steno-teal/5 rounded-lg border border-steno-teal/20 p-6">
          <h2 className="text-xl font-heading font-semibold text-steno-navy mb-4">ROI Calculation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-steno-charcoal-light mb-1">Letters Generated</div>
              <div className="text-lg font-semibold text-steno-charcoal">{data.summary.lettersGenerated}</div>
            </div>
            <div>
              <div className="text-sm text-steno-charcoal-light mb-1">Hours Saved per Letter</div>
              <div className="text-lg font-semibold text-steno-charcoal">3 hours</div>
            </div>
            <div>
              <div className="text-sm text-steno-charcoal-light mb-1">Attorney Hourly Rate</div>
              <div className="text-lg font-semibold text-steno-charcoal">$250/hour</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-steno-teal/20">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-steno-charcoal-light mb-1">Total Time Saved</div>
                <div className="text-2xl font-heading font-bold text-steno-teal">{data.summary.timeSavedHours.toLocaleString()} hours</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-steno-charcoal-light mb-1">Estimated Value</div>
                <div className="text-2xl font-heading font-bold text-steno-navy">${data.summary.estimatedROI.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Analytics;


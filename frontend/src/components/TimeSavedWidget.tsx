import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

interface TimeSavedWidgetProps {
  userId?: string;
  draftLetterId?: string;
  compact?: boolean;
}

interface TimeSavedData {
  totalTimeSaved: number;
  totalLetters: number;
  averageTimeSaved: number;
}

const TimeSavedWidget: React.FC<TimeSavedWidgetProps> = ({ userId, draftLetterId, compact = false }) => {
  const [data, setData] = useState<TimeSavedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (draftLetterId) {
          // Get time saved for specific draft
          const response = await api.get(`/drafts/${draftLetterId}/metrics`);
          // This would need a new endpoint or we calculate from time tracking
          // For now, use general stats
        }
        
        // Get general time saved stats
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const isAdmin = user.role === 'admin';
        
        if (isAdmin && !userId) {
          const response = await api.get('/admin/time-saved');
          setData(response.data.data);
        } else {
          // User-specific stats would need a new endpoint
          // For now, show placeholder
          setData({
            totalTimeSaved: 0,
            totalLetters: 0,
            averageTimeSaved: 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch time saved data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, draftLetterId]);

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!data) return null;

  if (compact) {
    return (
      <div className="bg-blue-50 p-3 rounded-lg">
        <div className="text-sm text-gray-600">Time Saved</div>
        <div className="text-2xl font-bold text-blue-600">{formatTime(data.totalTimeSaved)}</div>
        <div className="text-xs text-gray-500">{data.totalLetters} letters</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Time Saved</h3>
      <div className="space-y-4">
        <div>
          <div className="text-sm text-gray-600 mb-1">Total Time Saved</div>
          <div className="text-3xl font-bold text-blue-600">{formatTime(data.totalTimeSaved)}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Letters Generated</div>
            <div className="text-xl font-semibold">{data.totalLetters}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Average per Letter</div>
            <div className="text-xl font-semibold">{formatTime(data.averageTimeSaved)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeSavedWidget;


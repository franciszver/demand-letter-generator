import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { RefinementHistory } from '../../../shared/types';
import MetricsMeters from './MetricsMeters';

interface RefinementHistoryProps {
  draftLetterId: string;
}

const RefinementHistoryComponent: React.FC<RefinementHistoryProps> = ({ draftLetterId }) => {
  const [history, setHistory] = useState<RefinementHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/drafts/${draftLetterId}/history`);
        if (response.data.success) {
          setHistory(response.data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch refinement history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [draftLetterId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded"></div>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No refinement history available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((item) => (
        <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-sm font-semibold text-gray-700">Version {item.version}</div>
              <div className="text-xs text-gray-500">
                {new Date(item.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="mt-3 mb-3">
            <div className="text-sm font-medium text-gray-700 mb-1">Refinement Prompt:</div>
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              {item.promptText}
            </div>
          </div>

          {item.metricsBefore && item.metricsAfter && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-gray-600 mb-2">Before</div>
                <MetricsMeters metrics={item.metricsBefore} compact showLabels={false} />
              </div>
              <div>
                <div className="text-xs font-medium text-gray-600 mb-2">After</div>
                <MetricsMeters metrics={item.metricsAfter} compact showLabels={false} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default RefinementHistoryComponent;


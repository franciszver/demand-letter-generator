import React from 'react';
import { ActiveUser } from '../services/polling';

interface ActivityIndicatorProps {
  activeUsers: ActiveUser[];
  lastModifiedBy?: {
    name: string;
    email: string;
  };
  lastModifiedAt?: string;
  versionChanged?: boolean;
  onRefresh?: () => void;
}

const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({
  activeUsers,
  lastModifiedBy,
  lastModifiedAt,
  versionChanged,
  onRefresh,
}) => {
  return (
    <div className="space-y-2">
      {/* Version change notification */}
      {versionChanged && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-blue-800">
              Document updated. Refreshing...
            </span>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Refresh Now
            </button>
          )}
        </div>
      )}

      {/* Active users */}
      {activeUsers.length > 0 && (
        <div className="bg-steno-gray-50 border border-steno-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-steno-charcoal-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-sm font-medium text-steno-charcoal-light">
              Active Users ({activeUsers.length})
            </span>
          </div>
          <div className="space-y-1">
            {activeUsers.map((user) => (
              <div key={user.id} className="text-sm text-steno-charcoal flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{user.name}</span>
                <span className="text-steno-charcoal-light">({user.email})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last modified info */}
      {lastModifiedBy && lastModifiedAt && (
        <div className="text-xs text-steno-charcoal-light">
          Last modified by {lastModifiedBy.name} at {new Date(lastModifiedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default ActivityIndicator;


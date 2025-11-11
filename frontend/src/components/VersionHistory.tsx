import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import { LoadingSpinner } from './LoadingStates';

interface Version {
  id: string;
  draftLetterId: string;
  versionNumber: number;
  content: string;
  changeSummary: string | null;
  createdBy: string | null;
  createdAt: string;
}

interface VersionHistoryProps {
  draftId: string;
  onSelectVersion?: (version: Version) => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({ draftId, onSelectVersion }) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);

  useEffect(() => {
    loadVersions();
  }, [draftId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const response = await api.get<{ success: boolean; data: Version[] }>(`/drafts/${draftId}/versions`);
      if (response.data.success) {
        setVersions(response.data.data || []);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSnapshot = async () => {
    const changeSummary = prompt('Enter a brief description of changes (optional):');
    try {
      const response = await api.post<{ success: boolean; data: Version }>(`/drafts/${draftId}/versions`, {
        changeSummary: changeSummary || undefined,
      });
      if (response.data.success) {
        toast.success('Version snapshot created');
        loadVersions();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to create snapshot');
    }
  };

  const handleSelectVersion = (version: Version) => {
    setSelectedVersion(version);
    if (onSelectVersion) {
      onSelectVersion(version);
    }
  };

  if (loading) {
    return <LoadingSpinner size="sm" text="Loading version history..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-heading font-semibold text-steno-navy">Version History</h3>
        <button
          onClick={handleCreateSnapshot}
          className="px-3 py-1 bg-steno-teal text-white text-sm rounded hover:bg-steno-teal-dark font-medium transition-colors"
        >
          Create Snapshot
        </button>
      </div>

      {versions.length === 0 ? (
        <p className="text-steno-charcoal-light text-sm">No version history available.</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {versions.map((version) => (
            <div
              key={version.id}
              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                selectedVersion?.id === version.id
                  ? 'border-steno-teal bg-steno-teal/10'
                  : 'border-steno-gray-300 hover:border-steno-gray-400'
              }`}
              onClick={() => handleSelectVersion(version)}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="font-medium text-steno-charcoal">
                  Version {version.versionNumber}
                </div>
                <div className="text-xs text-steno-charcoal-light">
                  {new Date(version.createdAt).toLocaleString()}
                </div>
              </div>
              {version.changeSummary && (
                <div className="text-sm text-steno-charcoal-light mb-1">
                  {version.changeSummary}
                </div>
              )}
              <div className="text-xs text-steno-gray-500">
                {version.content.length} characters
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedVersion && (
        <div className="mt-4 p-4 bg-steno-gray-50 rounded-lg border border-steno-gray-300">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-steno-charcoal">
              Version {selectedVersion.versionNumber} Content
            </h4>
            <button
              onClick={() => setSelectedVersion(null)}
              className="text-sm text-steno-charcoal-light hover:text-steno-charcoal"
            >
              Close
            </button>
          </div>
          <div className="text-sm text-steno-charcoal whitespace-pre-wrap max-h-64 overflow-y-auto">
            {selectedVersion.content.substring(0, 500)}
            {selectedVersion.content.length > 500 && '...'}
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionHistory;


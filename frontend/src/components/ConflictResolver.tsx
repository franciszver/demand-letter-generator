import React, { useState, useEffect } from 'react';
import { ConflictResolver as ConflictResolverService } from '../services/conflict-resolver';

interface ConflictResolverProps {
  localContent: string;
  serverContent: string;
  currentVersion: number;
  onResolve: (action: 'keep-mine' | 'use-server' | 'retry-merge') => void;
  onClose: () => void;
}

const ConflictResolver: React.FC<ConflictResolverProps> = ({
  localContent,
  serverContent,
  currentVersion,
  onResolve,
  onClose,
}) => {
  const [attemptingMerge, setAttemptingMerge] = useState(false);

  const handleAutoMerge = () => {
    setAttemptingMerge(true);
    const canMerge = ConflictResolverService.canAutoMerge(localContent, serverContent);
    
    if (canMerge) {
      // Auto-merge successful
      onResolve('retry-merge');
    } else {
      // True conflict - show both versions
      setAttemptingMerge(false);
    }
  };

  // Check if we can auto-merge on mount
  useEffect(() => {
    const canMerge = ConflictResolverService.canAutoMerge(localContent, serverContent);
    if (canMerge) {
      // Auto-merge immediately
      onResolve('retry-merge');
    }
  }, [localContent, serverContent, onResolve]);

  const canAutoMerge = ConflictResolverService.canAutoMerge(localContent, serverContent);

  if (canAutoMerge && !attemptingMerge) {
    // Auto-merge will happen via useEffect
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-red-50 border-b border-red-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-red-800">Conflict Detected</h3>
          <p className="text-sm text-red-700 mt-1">
            Another user has modified this document. Choose how to resolve the conflict.
          </p>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Local content */}
            <div>
              <h4 className="font-semibold text-steno-navy mb-2">Your Version</h4>
              <div className="border border-steno-gray-300 rounded p-3 bg-steno-gray-50 max-h-96 overflow-auto">
                <pre className="whitespace-pre-wrap text-sm text-steno-charcoal">{localContent}</pre>
              </div>
            </div>

            {/* Server content */}
            <div>
              <h4 className="font-semibold text-steno-navy mb-2">Server Version (v{currentVersion})</h4>
              <div className="border border-steno-gray-300 rounded p-3 bg-steno-gray-50 max-h-96 overflow-auto">
                <pre className="whitespace-pre-wrap text-sm text-steno-charcoal">{serverContent}</pre>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-steno-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-steno-charcoal hover:bg-steno-gray-100 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onResolve('use-server')}
            className="px-4 py-2 bg-steno-gray-200 text-steno-charcoal hover:bg-steno-gray-300 rounded-lg font-medium transition-colors"
          >
            Use Server Version
          </button>
          <button
            onClick={() => onResolve('keep-mine')}
            className="px-4 py-2 bg-steno-teal text-white hover:bg-steno-teal-dark rounded-lg font-medium transition-colors"
          >
            Keep My Changes
          </button>
          {!canAutoMerge && (
            <button
              onClick={handleAutoMerge}
              disabled={attemptingMerge}
              className="px-4 py-2 bg-steno-navy text-white hover:bg-steno-navy-dark rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {attemptingMerge ? 'Merging...' : 'Try Auto-Merge'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConflictResolver;


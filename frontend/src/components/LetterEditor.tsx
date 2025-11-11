import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Editor, EditorState, ContentState } from 'draft-js';
import 'draft-js/dist/Draft.css';
import { api } from '../services/api';
import { wsService } from '../services/websocket';
import { pollingService, DraftActivity } from '../services/polling';
import { toast } from 'react-toastify';
import MetricsMeters from './MetricsMeters';
import ActivityIndicator from './ActivityIndicator';
import ConflictResolver from './ConflictResolver';
import { LetterMetrics, DraftLetter } from '../../../shared/types';

interface LetterEditorProps {
  draftId?: string;
  initialContent?: string;
  onSave?: (content: string) => void;
  showRefinement?: boolean;
  onRefine?: (instructions: string) => void;
  activeUsers?: Array<{ id: string; name: string; email: string }>;
}

const LetterEditor: React.FC<LetterEditorProps> = ({
  draftId,
  initialContent = '',
  onSave,
  showRefinement = true,
  onRefine,
  activeUsers = [],
}) => {
  const [editorState, setEditorState] = useState(() => {
    if (initialContent) {
      return EditorState.createWithContent(ContentState.createFromText(initialContent));
    }
    return EditorState.createEmpty();
  });
  const [refinementInstructions, setRefinementInstructions] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [metrics, setMetrics] = useState<LetterMetrics | null>(null);
  const [calculatingMetrics, setCalculatingMetrics] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [activity, setActivity] = useState<DraftActivity | null>(null);
  const [versionChanged, setVersionChanged] = useState(false);
  const [conflict, setConflict] = useState<{ currentVersion: number; serverContent: string } | null>(null);
  const isRefreshingRef = useRef(false);

  // Update editor content when initialContent changes (e.g., when draft loads)
  useEffect(() => {
    if (initialContent) {
      const newContent = ContentState.createFromText(initialContent);
      setEditorState(EditorState.createWithContent(newContent));
    }
  }, [initialContent]);

  // Join collaboration session if draftId provided (WebSocket - optional)
  useEffect(() => {
    if (draftId && wsService.isConnected()) {
      wsService.joinDraft(draftId);

      wsService.onContentUpdated((data) => {
        // Update editor with remote changes
        const newContent = ContentState.createFromText(data.content);
        setEditorState(EditorState.createWithContent(newContent));
        toast.info(`${data.userName} updated the letter`);
      });

      return () => {
        wsService.off('content-updated');
      };
    }
  }, [draftId]);

  // Start polling for activity and version changes
  useEffect(() => {
    if (!draftId) return;

    // Get initial version
    pollingService.getCurrentVersion(draftId).then(version => {
      if (version !== null) {
        setCurrentVersion(version);
      }
    });

    // Start polling
    pollingService.startPolling(
      draftId,
      (activityData) => {
        setActivity(activityData);
        setCurrentVersion(activityData.currentVersion);
      },
      (newVersion, lastModifiedBy) => {
        // Version changed - auto-refresh
        setVersionChanged(true);
        setCurrentVersion(newVersion);
        
        // Refresh content
        if (!isRefreshingRef.current) {
          isRefreshingRef.current = true;
          api.get(`/drafts/${draftId}`)
            .then(response => {
              if (response.data.success && response.data.data) {
                const draft = response.data.data as DraftLetter;
                const newContent = ContentState.createFromText(draft.content);
                setEditorState(EditorState.createWithContent(newContent));
                setCurrentVersion(draft.version);
                toast.info(`Document updated by ${lastModifiedBy?.name || 'another user'}. Refreshed.`);
              }
            })
            .catch(error => {
              console.error('Failed to refresh draft:', error);
            })
            .finally(() => {
              isRefreshingRef.current = false;
              setTimeout(() => setVersionChanged(false), 3000);
            });
        }
      }
    );

    return () => {
      pollingService.stopPolling(draftId);
    };
  }, [draftId]);

  // Auto-save functionality with version tracking
  useEffect(() => {
    const timer = setTimeout(async () => {
      const content = editorState.getCurrentContent().getPlainText();
      if (!content || !draftId) return;

      // Save with version check
      try {
        const response = await api.patch(`/drafts/${draftId}`, {
          content,
          expectedVersion: currentVersion,
        });

        if (response.data.success) {
          setCurrentVersion(response.data.data.version);
          setLastSaved(new Date());
          if (onSave) {
            onSave(content);
          }
        }
      } catch (error: any) {
        // Check if it's a conflict
        if (error.response?.status === 409 && error.response?.data?.conflict) {
          const conflictData = error.response.data;
          setConflict({
            currentVersion: conflictData.currentVersion,
            serverContent: conflictData.serverContent,
          });
        } else {
          console.error('Failed to save draft:', error);
        }
      }

      // Broadcast changes if WebSocket is connected
      if (draftId && wsService.isConnected()) {
        wsService.sendContentChange(draftId, content, {});
      }
    }, 2000); // Debounce 2 seconds

    return () => clearTimeout(timer);
  }, [editorState, draftId, onSave, currentVersion]);

  // Calculate metrics when content changes (debounced)
  useEffect(() => {
    if (!draftId) return;

    const timer = setTimeout(async () => {
      const content = editorState.getCurrentContent().getPlainText();
      if (content.length > 100) {
        try {
          setCalculatingMetrics(true);
          const response = await api.post('/metrics/calculate', {
            draftId,
            content,
          });
          if (response.data.success && response.data.data) {
            // Convert to LetterMetrics format
            const metricsData = response.data.data;
            setMetrics({
              id: '',
              draftLetterId: draftId,
              ...metricsData,
              calculatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('Failed to calculate metrics:', error);
        } finally {
          setCalculatingMetrics(false);
        }
      }
    }, 5000); // Debounce 5 seconds for metrics calculation

    return () => clearTimeout(timer);
  }, [editorState, draftId]);

  // Load existing metrics if draftId provided
  useEffect(() => {
    if (draftId) {
      api.get(`/drafts/${draftId}/metrics`)
        .then((response) => {
          if (response.data.success && response.data.data) {
            setMetrics(response.data.data);
          }
        })
        .catch(() => {
          // Metrics might not exist yet
        });
    }
  }, [draftId]);

  const handleRefine = useCallback(async () => {
    if (!refinementInstructions.trim() || !onRefine) return;

    setIsRefining(true);
    try {
      await onRefine(refinementInstructions);
      setRefinementInstructions('');
      toast.success('Letter refinement applied successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to refine letter. Please try again.');
    } finally {
      setIsRefining(false);
    }
  }, [refinementInstructions, onRefine]);

  const handleConflictResolve = useCallback(async (action: 'keep-mine' | 'use-server' | 'retry-merge') => {
    if (!draftId || !conflict) return;

    const content = editorState.getCurrentContent().getPlainText();

    if (action === 'use-server') {
      // Use server version
      const newContent = ContentState.createFromText(conflict.serverContent);
      setEditorState(EditorState.createWithContent(newContent));
      setCurrentVersion(conflict.currentVersion);
      setConflict(null);
      toast.info('Using server version');
    } else if (action === 'keep-mine') {
      // Retry with new version
      try {
        const response = await api.patch(`/drafts/${draftId}`, {
          content,
          expectedVersion: conflict.currentVersion,
        });

        if (response.data.success) {
          setCurrentVersion(response.data.data.version);
          setConflict(null);
          toast.success('Your changes saved');
        } else {
          // Still conflicted - show again
          toast.error('Conflict persists. Please review changes.');
        }
      } catch (error: any) {
        if (error.response?.status === 409) {
          // Update conflict with latest
          setConflict({
            currentVersion: error.response.data.currentVersion,
            serverContent: error.response.data.serverContent,
          });
        }
      }
    } else if (action === 'retry-merge') {
      // Try auto-merge - retry save
      try {
        const response = await api.patch(`/drafts/${draftId}`, {
          content,
          expectedVersion: conflict.currentVersion,
        });

        if (response.data.success) {
          setCurrentVersion(response.data.data.version);
          setConflict(null);
          toast.success('Changes merged automatically');
        }
      } catch (error: any) {
        if (error.response?.status === 409) {
          setConflict({
            currentVersion: error.response.data.currentVersion,
            serverContent: error.response.data.serverContent,
          });
        }
      }
    }
  }, [draftId, conflict, editorState]);

  return (
    <div className="space-y-4">
      {/* Conflict resolver */}
      {conflict && (
        <ConflictResolver
          localContent={editorState.getCurrentContent().getPlainText()}
          serverContent={conflict.serverContent}
          currentVersion={conflict.currentVersion}
          onResolve={handleConflictResolve}
          onClose={() => setConflict(null)}
        />
      )}

      {/* Activity indicator */}
      {activity && (
        <ActivityIndicator
          activeUsers={activity.activeUsers}
          lastModifiedBy={activity.lastModifiedBy}
          lastModifiedAt={activity.lastModifiedAt}
          versionChanged={versionChanged}
          onRefresh={() => {
            if (draftId) {
              api.get(`/drafts/${draftId}`)
                .then(response => {
                  if (response.data.success && response.data.data) {
                    const draft = response.data.data as DraftLetter;
                    const newContent = ContentState.createFromText(draft.content);
                    setEditorState(EditorState.createWithContent(newContent));
                    setCurrentVersion(draft.version);
                    setVersionChanged(false);
                  }
                })
                .catch(console.error);
            }
          }}
        />
      )}

      {/* Active users indicator (fallback if polling not available) */}
      {activeUsers.length > 0 && !activity && (
        <div className="flex items-center gap-2 text-sm text-steno-charcoal-light">
          <span className="font-medium">Collaborating attorneys:</span>
          {activeUsers.map((user) => (
            <span
              key={user.id}
              className="px-2 py-1 bg-steno-teal/10 text-steno-teal-dark rounded font-medium"
            >
              {user.name}
            </span>
          ))}
        </div>
      )}

      {/* Editor */}
      <div className="border border-steno-gray-300 rounded-lg p-4 min-h-[400px] bg-white shadow-sm">
        <Editor
          editorState={editorState}
          onChange={setEditorState}
          placeholder="Begin drafting your demand letter. The AI will assist with structure and legal language..."
        />
      </div>

      {/* Metrics display */}
      {metrics && (
        <div className="border border-steno-gray-200 rounded-lg p-4 bg-white">
          <h4 className="text-sm font-semibold mb-3 text-steno-navy">Letter Metrics</h4>
          <MetricsMeters metrics={metrics} compact />
        </div>
      )}

      {calculatingMetrics && (
        <div className="text-sm text-steno-gray-500">
          Calculating metrics...
        </div>
      )}

      {/* Last saved indicator */}
      {lastSaved && (
        <div className="text-sm text-steno-gray-500">
          Last saved: {lastSaved.toLocaleTimeString()}
        </div>
      )}

      {/* Refinement section */}
      {showRefinement && onRefine && (
        <div className="border-t border-steno-gray-200 pt-4">
          <h3 className="text-lg font-heading font-semibold mb-2 text-steno-navy">AI Refinement</h3>
          <p className="text-sm text-steno-charcoal-light mb-3">
            Provide specific instructions to refine the letter's tone, content, or structure.
          </p>
          <textarea
            value={refinementInstructions}
            onChange={(e) => setRefinementInstructions(e.target.value)}
            placeholder="Example: 'Make the tone more formal and professional', 'Add more detail about the property damage', 'Strengthen the legal arguments in paragraph 3'"
            className="w-full p-3 border border-steno-gray-300 rounded-lg mb-2 focus:ring-steno-teal focus:border-steno-teal"
            rows={3}
          />
          <button
            onClick={handleRefine}
            disabled={!refinementInstructions.trim() || isRefining}
            className="px-4 py-2 bg-steno-teal text-white rounded-lg hover:bg-steno-teal-dark disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {isRefining ? 'Refining letter...' : 'Apply Refinement'}
          </button>
        </div>
      )}
    </div>
  );
};

export default LetterEditor;


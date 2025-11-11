import React, { useState, useEffect, useCallback } from 'react';
import { Editor, EditorState, ContentState } from 'draft-js';
import 'draft-js/dist/Draft.css';
import { api } from '../services/api';
import { wsService } from '../services/websocket';
import { toast } from 'react-toastify';

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

  // Join collaboration session if draftId provided
  useEffect(() => {
    if (draftId) {
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

  // Auto-save functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      const content = editorState.getCurrentContent().getPlainText();
      if (content && onSave) {
        onSave(content);
        setLastSaved(new Date());
      }

      // Broadcast changes if in collaboration mode
      if (draftId) {
        wsService.sendContentChange(draftId, content, {});
      }
    }, 2000); // Debounce 2 seconds

    return () => clearTimeout(timer);
  }, [editorState, draftId, onSave]);

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

  return (
    <div className="space-y-4">
      {/* Active users indicator */}
      {activeUsers.length > 0 && (
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


import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LetterEditor from '../components/LetterEditor';
import ExportButton from '../components/ExportButton';
import { api } from '../services/api';
import { wsService } from '../services/websocket';
import { toast } from 'react-toastify';
import { DraftLetter, Document } from '../../../shared/types';

const Editor: React.FC = () => {
  const { draftId } = useParams<{ draftId?: string }>();
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get('documentId');
  const navigate = useNavigate();
  const { isAuthenticated, token, loading: authLoading } = useAuth();
  const [draft, setDraft] = useState<DraftLetter | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();
  const [activeUsers, setActiveUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated && token) {
      wsService.connect(token);
      return () => {
        wsService.disconnect();
      };
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (isAuthenticated) {
      if (draftId) {
        loadDraft(draftId);
      } else if (documentId) {
        // Wait for document to be processed, then generate
        checkDocumentStatus(documentId);
      }
    }
  }, [draftId, documentId, isAuthenticated]);

  useEffect(() => {
    if (draftId) {
      wsService.joinDraft(draftId);

      wsService.onUsersList((users) => {
        setActiveUsers(users);
      });

      wsService.onUserJoined((data) => {
        setActiveUsers((prev) => [...prev, data]);
      });

      wsService.onUserLeft((data) => {
        setActiveUsers((prev) => prev.filter((u) => u.id !== data.userId));
      });

      return () => {
        wsService.off('users-list');
        wsService.off('user-joined');
        wsService.off('user-left');
      };
    }
  }, [draftId]);

  const loadDraft = async (id: string) => {
    try {
      const response = await api.get<{ success: boolean; data: DraftLetter }>(`/drafts/${id}`);
      if (response.data.success && response.data.data) {
        setDraft(response.data.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load draft');
    } finally {
      setLoading(false);
    }
  };

  const checkDocumentStatus = async (id: string) => {
    try {
      const loadDocument = async () => {
        try {
          const response = await api.get<{ success: boolean; data: Document }>(`/documents/${id}`);
          if (response.data.success && response.data.data) {
            const doc = response.data.data;
            setDocument(doc);
            
            if (doc.status === 'completed') {
              setLoading(false);
              toast.info('Document processed. Ready to generate letter.');
              return true;
            } else if (doc.status === 'failed') {
              setLoading(false);
              toast.error('Document processing failed');
              return true;
            }
          }
        } catch (error) {
          console.error('Error checking document status:', error);
        }
        return false;
      };

      // Check immediately
      if (await loadDocument()) return;

      // Poll document status
      const checkInterval = setInterval(async () => {
        if (await loadDocument()) {
          clearInterval(checkInterval);
        }
      }, 2000);

      // Stop polling after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        setLoading(false);
      }, 30000);
    } catch (error) {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!documentId) {
      toast.error('No document selected');
      return;
    }

    setGenerating(true);
    try {
      const response = await api.post<{ success: boolean; data: { draftId: string; content: string } }>(
        '/generate',
        { documentId, templateId: selectedTemplateId }
      );

      if (response.data.success && response.data.data) {
        const newDraftId = response.data.data.draftId;
        toast.success('Letter generated successfully!');
        navigate(`/editor/${newDraftId}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleRefine = async (instructions: string) => {
    if (!draftId) {
      toast.error('No draft to refine');
      return;
    }

    try {
      const response = await api.post<{ success: boolean; data: { content: string } }>('/refine', {
        draftId,
        instructions,
      });

      if (response.data.success && response.data.data) {
        // Update draft content
        setDraft((prev) => (prev ? { ...prev, content: response.data.data!.content } : null));
      }
    } catch (error: any) {
      throw error;
    }
  };

  const handleSave = async (content: string) => {
    // Auto-save functionality
    // This could be implemented with a PATCH endpoint
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <button
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Home
            </button>
            <h1 className="text-xl font-bold">Editor</h1>
            {draftId && <ExportButton draftId={draftId} />}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!draftId && documentId && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Generate Demand Letter</h2>
            <p className="text-gray-600 mb-4">
              Document uploaded. Select a template (optional) and generate your demand letter.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate Letter'}
              </button>
            </div>
          </div>
        )}

        {draftId && (
          <LetterEditor
            draftId={draftId}
            initialContent={draft?.content}
            onSave={handleSave}
            onRefine={handleRefine}
            activeUsers={activeUsers}
          />
        )}
      </main>
    </div>
  );
};

export default Editor;


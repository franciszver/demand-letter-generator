import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LetterEditor from '../components/LetterEditor';
import ExportButton from '../components/ExportButton';
import EQDataForm from '../components/EQDataForm';
import RefinementHistoryComponent from '../components/RefinementHistory';
import { api } from '../services/api';
import { wsService } from '../services/websocket';
import { toast } from 'react-toastify';
import { DraftLetter, Document, CaseContext } from '../../../shared/types';

const Editor: React.FC = () => {
  const { draftId } = useParams<{ draftId?: string }>();
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get('documentId');
  const navigate = useNavigate();
  const { isAuthenticated, token, loading: authLoading, user } = useAuth();
  const [draft, setDraft] = useState<DraftLetter | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();
  const [activeUsers, setActiveUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [showCaseContext, setShowCaseContext] = useState(false);
  const [caseContext, setCaseContext] = useState<Partial<CaseContext>>({});
  const [showRefinementHistory, setShowRefinementHistory] = useState(false);

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
        // Only load if we don't already have this draft, or if draft content is missing
        if (!draft || draft.id !== draftId || !draft.content) {
          setLoading(true);
          loadDraft(draftId);
        } else {
          // We already have the draft with content, just ensure loading is false
          setLoading(false);
        }
      } else if (documentId) {
        // Wait for document to be processed, then generate
        setLoading(true);
        checkDocumentStatus(documentId);
      } else {
        setLoading(false);
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
      toast.error(error.response?.data?.error || 'Unable to load letter draft');
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
              return true;
            } else if (doc.status === 'failed') {
              setLoading(false);
              toast.error('Case document processing was unsuccessful. Please try uploading again.');
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
      toast.error('Please select a case document to proceed');
      return;
    }

    setGenerating(true);
    try {
      const response = await api.post<{ success: boolean; data: { draftId: string; content: string; metrics?: any } }>(
        '/generate',
        { 
          documentId, 
          templateId: selectedTemplateId,
          caseContext: Object.keys(caseContext).length > 0 ? caseContext : undefined
        }
      );

      if (response.data.success && response.data.data) {
        const newDraftId = response.data.data.draftId;
        const draftContent = response.data.data.content;
        
        // Set the draft immediately with the content from the response
        // This ensures the editor shows content right away without waiting for a reload
        // Load full draft to get version
        const draftResponse = await api.get<{ success: boolean; data: DraftLetter }>(`/drafts/${newDraftId}`);
        if (draftResponse.data.success && draftResponse.data.data) {
          setDraft(draftResponse.data.data);
        } else {
          // Fallback if draft load fails
          setDraft({
            id: newDraftId,
            content: draftContent,
            userId: user?.id || '',
            documentId: documentId!,
            templateId: selectedTemplateId,
            title: `Demand Letter - ${document?.originalName || 'Untitled'}`,
            s3Key: '',
            version: 1,
            status: 'generated',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as DraftLetter);
        }
        
        setLoading(false); // Stop loading since we have the content
        toast.success('Demand letter draft created successfully!');
        navigate(`/editor/${newDraftId}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to create demand letter draft. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRefine = async (instructions: string) => {
    if (!draftId) {
      toast.error('No letter draft available to refine');
      return;
    }

    try {
      const response = await api.post<{ success: boolean; data: { content: string } }>('/refine', {
        draftId,
        instructions,
      });

      if (response.data.success && response.data.data) {
        // Update draft content and version
        setDraft((prev) => (prev ? { 
          ...prev, 
          content: response.data.data!.content,
          version: response.data.data!.version || prev.version
        } : null));
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
      <div className="min-h-screen flex items-center justify-center bg-steno-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-steno-navy mb-4"></div>
          <p className="text-steno-charcoal">Loading letter draft...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-steno-gray-50">
      <nav className="bg-white shadow-sm border-b border-steno-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="text-steno-teal hover:text-steno-teal-dark font-medium transition-colors"
              >
                ← Back to Home
              </button>
              <h1 className="text-xl font-heading font-bold text-steno-navy">Letter Editor</h1>
            </div>
            {draftId && <ExportButton draftId={draftId} />}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!draftId && documentId && (
          <div className="mb-6 space-y-4">
            <div className="p-6 bg-gradient-to-r from-steno-teal/10 to-steno-teal/5 border border-steno-teal/20 rounded-lg">
              <h2 className="text-lg font-heading font-semibold mb-2 text-steno-navy">Create Demand Letter Draft</h2>
              <p className="text-steno-charcoal mb-4">
                Case document uploaded successfully. Optionally provide case context to enhance the letter generation.
              </p>
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setShowCaseContext(!showCaseContext)}
                  className="px-4 py-2 bg-steno-teal text-white rounded-lg hover:bg-steno-teal-dark font-medium transition-colors"
                >
                  {showCaseContext ? 'Hide' : 'Add'} Case Context
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-6 py-2 bg-steno-navy text-white rounded-lg hover:bg-steno-navy-dark disabled:opacity-50 font-medium transition-colors"
                >
                  {generating ? 'Creating Draft...' : 'Create Demand Letter Draft'}
                </button>
              </div>
            </div>

            {showCaseContext && user && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <EQDataForm 
                  userId={user.id} 
                  mode="case-context"
                  onCaseContextChange={(context) => setCaseContext(context)}
                  onSave={(context) => {
                    if (context) setCaseContext(context);
                    setShowCaseContext(false);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {draftId && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <button
                onClick={() => setShowRefinementHistory(!showRefinementHistory)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                {showRefinementHistory ? 'Hide' : 'Show'} Refinement History
              </button>
            </div>

            {showRefinementHistory && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Refinement History</h3>
                <RefinementHistoryComponent draftLetterId={draftId} />
              </div>
            )}

            <LetterEditor
              draftId={draftId}
              initialContent={draft?.content}
              onSave={handleSave}
              onRefine={handleRefine}
              activeUsers={activeUsers}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Editor;


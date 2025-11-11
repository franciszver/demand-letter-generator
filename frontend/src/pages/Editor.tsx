import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LetterEditor from '../components/LetterEditor';
import ExportButton from '../components/ExportButton';
import VersionHistory from '../components/VersionHistory';
import { api } from '../services/api';
import { wsService } from '../services/websocket';
import { toast } from 'react-toastify';
import { DraftLetter, Document, Template } from '../../../shared/types';

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
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

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
        // Load templates for selection
        loadTemplates();
      }
    }
  }, [draftId, documentId, isAuthenticated]);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await api.get<{ success: boolean; data: Template[] }>('/templates');
      if (response.data.success) {
        setTemplates(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

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
              toast.info('Case document processed. Ready to create demand letter draft.');
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
      const response = await api.post<{ success: boolean; data: { draftId: string; content: string } }>(
        '/generate',
        { documentId, templateId: selectedTemplateId }
      );

      if (response.data.success && response.data.data) {
        const newDraftId = response.data.data.draftId;
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
        // Update draft content
        setDraft((prev) => (prev ? { ...prev, content: response.data.data!.content } : null));
      }
    } catch (error: any) {
      throw error;
    }
  };

  const handleSave = async (content: string) => {
    if (!draftId) return;

    try {
      await api.patch(`/drafts/${draftId}`, { content });
      // Success is handled by LetterEditor's lastSaved state
    } catch (error: any) {
      console.error('Auto-save failed:', error);
      // Don't show error toast for auto-save failures to avoid annoying users
      // The error will be logged for debugging
    }
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
          <div className="mb-6 p-6 bg-gradient-to-r from-steno-teal/10 to-steno-teal/5 border border-steno-teal/20 rounded-lg">
            <h2 className="text-lg font-heading font-semibold mb-2 text-steno-navy">Create Demand Letter Draft</h2>
            <p className="text-steno-charcoal mb-4">
              Case document uploaded successfully. Select a firm template (optional) and create your demand letter draft.
            </p>
            
            {/* Template Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-steno-charcoal mb-2">
                Select Firm Template (Optional)
              </label>
              {loadingTemplates ? (
                <div className="text-sm text-steno-charcoal-light">Loading templates...</div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="no-template"
                      name="template"
                      checked={!selectedTemplateId}
                      onChange={() => setSelectedTemplateId(undefined)}
                      className="text-steno-teal focus:ring-steno-teal"
                    />
                    <label htmlFor="no-template" className="text-sm text-steno-charcoal cursor-pointer">
                      No template (AI will generate from scratch)
                    </label>
                  </div>
                  {templates.map((template) => (
                    <div key={template.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        id={`template-${template.id}`}
                        name="template"
                        checked={selectedTemplateId === template.id}
                        onChange={() => setSelectedTemplateId(template.id)}
                        className="text-steno-teal focus:ring-steno-teal"
                      />
                      <label htmlFor={`template-${template.id}`} className="text-sm text-steno-charcoal cursor-pointer flex-1">
                        <span className="font-medium">{template.name}</span>
                        {template.variables && template.variables.length > 0 && (
                          <span className="text-steno-charcoal-light ml-2">
                            ({template.variables.length} variable{template.variables.length !== 1 ? 's' : ''})
                          </span>
                        )}
                      </label>
                    </div>
                  ))}
                  {templates.length === 0 && (
                    <p className="text-sm text-steno-charcoal-light italic">No firm templates available. Create templates on the home page.</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-6 py-2 bg-steno-navy text-white rounded-lg hover:bg-steno-navy-dark disabled:opacity-50 font-medium transition-colors"
              >
                {generating ? 'Creating Draft...' : 'Create Demand Letter Draft'}
              </button>
            </div>
          </div>
        )}

        {draftId && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <LetterEditor
                draftId={draftId}
                initialContent={draft?.content}
                onSave={handleSave}
                onRefine={handleRefine}
                activeUsers={activeUsers}
              />
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-4">
                <VersionHistory draftId={draftId} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Editor;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DocumentUpload from '../components/DocumentUpload';
import TemplateManager from '../components/TemplateManager';
import { api } from '../services/api';
import { DraftLetter } from '../../../shared/types';
import { toast } from 'react-toastify';

const Home: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [recentDrafts, setRecentDrafts] = useState<DraftLetter[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      loadRecentDrafts();
    }
  }, [isAuthenticated]);

  const loadRecentDrafts = async () => {
    try {
      const response = await api.get<{ success: boolean; data: DraftLetter[] }>('/drafts');
      if (response.data.success) {
        setRecentDrafts(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load drafts:', error);
    } finally {
      setLoadingDrafts(false);
    }
  };

  const handleUploadSuccess = (documentId: string) => {
    // Navigate to editor with document ID
    navigate(`/editor?documentId=${documentId}`);
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-steno-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-steno-navy mb-4"></div>
          <p className="text-steno-charcoal">Loading Steno Draft...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-steno-gray-50">
      <nav className="bg-white shadow-sm border-b border-steno-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-heading font-bold text-steno-navy">Steno Draft</h1>
              <span className="text-xs text-steno-teal font-medium hidden sm:inline">Generate demand letters in minutes, not hours.</span>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}
              className="px-4 py-2 text-steno-charcoal hover:text-steno-navy font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <section className="bg-gradient-to-r from-steno-navy to-steno-navy-dark rounded-lg p-6 text-white">
            <h2 className="text-2xl font-heading font-bold mb-2">Welcome to Steno Draft</h2>
            <p className="text-steno-gray-200">
              Your firm's AI-powered assistant for demand letters. Upload case documents, generate a professional draft in minutes, refine it with attorney instructions, and export a polished Word document — all while saving valuable time and maintaining firm-wide consistency.
            </p>
          </section>

          {/* Upload Section */}
          <section>
            <h2 className="text-2xl font-heading font-semibold text-steno-navy mb-4">Upload Case Document</h2>
            <DocumentUpload onUploadSuccess={handleUploadSuccess} />
          </section>

          {/* Recent Drafts */}
          {recentDrafts.length > 0 && (
            <section>
              <h2 className="text-2xl font-heading font-semibold text-steno-navy mb-4">Recent Letter Drafts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="border border-steno-gray-300 rounded-lg p-4 bg-white hover:shadow-lg transition-all cursor-pointer hover:border-steno-teal"
                    onClick={() => navigate(`/editor/${draft.id}`)}
                  >
                    <h3 className="font-heading font-semibold text-lg mb-2 text-steno-navy">{draft.title}</h3>
                    <p className="text-sm text-steno-charcoal-light mb-2 line-clamp-3">
                      {draft.content.substring(0, 100)}...
                    </p>
                    <div className="text-xs text-steno-gray-500">
                      Last updated: {new Date(draft.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Templates Section */}
          <section>
            <TemplateManager />
          </section>
          
          {/* Empty State for Recent Drafts */}
          {recentDrafts.length === 0 && !loadingDrafts && (
            <section className="text-center py-12">
              <div className="max-w-md mx-auto">
                <svg className="mx-auto h-16 w-16 text-steno-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-heading font-semibold text-steno-charcoal mb-2">No letter drafts yet</h3>
                <p className="text-steno-charcoal-light">Upload a case document above to create your first demand letter draft.</p>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;


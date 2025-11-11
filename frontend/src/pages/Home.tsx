import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DocumentUpload from '../components/DocumentUpload';
import TemplateManager from '../components/TemplateManager';
import { api } from '../services/api';
import { DraftLetter } from '../../../shared/types';
import { toast } from 'react-toastify';

const Home: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();
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
              <span className="text-xs text-steno-teal-dark font-semibold hidden sm:inline bg-steno-teal/10 px-3 py-1 rounded-full">Generate demand letters in minutes, not hours.</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/profile')}
                className="px-3 py-2 text-steno-charcoal hover:text-steno-navy font-medium transition-colors"
              >
                Profile
              </button>
              {user?.role === 'attorney' || user?.role === 'admin' ? (
                <button
                  onClick={() => navigate('/users')}
                  className="px-3 py-2 text-steno-charcoal hover:text-steno-navy font-medium transition-colors"
                >
                  Users
                </button>
              ) : null}
              {user?.role === 'admin' ? (
                <button
                  onClick={() => navigate('/admin')}
                  className="px-3 py-2 text-steno-charcoal hover:text-steno-navy font-medium transition-colors"
                >
                  Admin
                </button>
              ) : null}
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
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <section className="bg-gradient-to-br from-steno-navy-light via-steno-navy to-steno-navy-light rounded-xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-steno-teal/15 rounded-full -mr-32 -mt-32"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-3xl font-heading font-bold text-white" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.4), 0 0 2px rgba(0, 0, 0, 0.5)' }}>Welcome to Steno Draft</h2>
                <span className="text-steno-gold-light text-lg" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>⚖</span>
              </div>
              <p className="text-white text-lg leading-relaxed max-w-3xl" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)' }}>
                Your firm's AI-powered assistant for demand letters. Upload case documents, generate a professional draft in minutes, refine it with attorney instructions, and export a polished Word document — all while saving valuable time and maintaining firm-wide consistency.
              </p>
            </div>
          </section>

          {/* Upload Section */}
          <section className="bg-white rounded-xl p-6 shadow-sm border border-steno-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-steno-teal/10 rounded-lg">
                <svg className="w-6 h-6 text-steno-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-heading font-semibold text-steno-navy">Upload Case Document</h2>
                <p className="text-sm text-steno-charcoal-light mt-1">Start by uploading your case documents</p>
              </div>
            </div>
            <DocumentUpload onUploadSuccess={handleUploadSuccess} />
          </section>

          {/* Recent Drafts */}
          {recentDrafts.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-steno-navy/10 rounded-lg">
                  <svg className="w-6 h-6 text-steno-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-heading font-semibold text-steno-navy">Recent Letter Drafts</h2>
                  <p className="text-sm text-steno-charcoal-light mt-1">Continue working on your drafts</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="group border-2 border-steno-gray-200 rounded-xl p-5 bg-white hover:border-steno-teal hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1"
                    onClick={() => navigate(`/editor/${draft.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-heading font-semibold text-lg text-steno-navy group-hover:text-steno-teal transition-colors line-clamp-1">{draft.title}</h3>
                      <svg className="w-5 h-5 text-steno-gray-400 group-hover:text-steno-teal transition-colors flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <p className="text-sm text-steno-charcoal-light mb-3 line-clamp-3 leading-relaxed">
                      {draft.content.substring(0, 100)}...
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-steno-gray-100">
                      <div className="text-xs text-steno-gray-500">
                        Updated {new Date(draft.updatedAt).toLocaleDateString()}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        draft.status === 'generated' ? 'bg-steno-teal/10 text-steno-teal-dark' :
                        draft.status === 'final' ? 'bg-steno-gold/10 text-steno-gold-dark' :
                        'bg-steno-gray-100 text-steno-charcoal-light'
                      }`}>
                        {draft.status}
                      </span>
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
            <section className="text-center py-12 bg-white rounded-xl border border-steno-gray-200">
              <div className="max-w-md mx-auto">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-steno-gray-100 rounded-full mb-6">
                  <svg className="w-10 h-10 text-steno-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-heading font-semibold text-steno-navy mb-2">No letter drafts yet</h3>
                <p className="text-steno-charcoal-light mb-6">Upload a case document above to create your first demand letter draft.</p>
                <div className="flex items-center justify-center gap-2 text-sm text-steno-teal">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Tip: Start by uploading a case document</span>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;


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
            <h1 className="text-xl font-bold">Demand Letter Generator</h1>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Upload Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Upload Document</h2>
            <DocumentUpload onUploadSuccess={handleUploadSuccess} />
          </section>

          {/* Recent Drafts */}
          {recentDrafts.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">Recent Drafts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="border border-gray-300 rounded-lg p-4 bg-white hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/editor/${draft.id}`)}
                  >
                    <h3 className="font-semibold text-lg mb-2">{draft.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {draft.content.substring(0, 100)}...
                    </p>
                    <div className="text-xs text-gray-500">
                      {new Date(draft.updatedAt).toLocaleDateString()}
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
        </div>
      </main>
    </div>
  );
};

export default Home;


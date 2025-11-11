import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { toast } from 'react-toastify';
import AdminLayout from '../../components/AdminLayout';
import { Template, DraftLetter } from '../../../shared/types';
import { LoadingSpinner } from '../../components/LoadingStates';

const ContentManagement: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [drafts, setDrafts] = useState<DraftLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'templates' | 'drafts'>('templates');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      const response = await api.get<{ success: boolean; data: { templates: Template[]; drafts: DraftLetter[] } }>('/admin/content');
      if (response.data.success && response.data.data) {
        setTemplates(response.data.data.templates || []);
        setDrafts(response.data.data.drafts || []);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to load content');
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDrafts = drafts.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner size="lg" text="Loading content..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-steno-navy mb-2">Content Management</h1>
          <p className="text-steno-charcoal-light">
            View and manage all firm templates and letter drafts across all users.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-steno-gray-300">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'templates'
                  ? 'border-b-2 border-steno-navy text-steno-navy'
                  : 'text-steno-charcoal-light hover:text-steno-charcoal'
              }`}
            >
              Templates ({templates.length})
            </button>
            <button
              onClick={() => setActiveTab('drafts')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'drafts'
                  ? 'border-b-2 border-steno-navy text-steno-navy'
                  : 'text-steno-charcoal-light hover:text-steno-charcoal'
              }`}
            >
              Letter Drafts ({drafts.length})
            </button>
          </nav>
        </div>

        {/* Search */}
        <div>
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-steno-gray-300 rounded-lg focus:ring-steno-teal focus:border-steno-teal"
          />
        </div>

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300">
            <div className="p-4 border-b border-steno-gray-200">
              <h2 className="text-xl font-heading font-semibold text-steno-navy">Firm Templates</h2>
            </div>
            <div className="p-4">
              {filteredTemplates.length === 0 ? (
                <p className="text-steno-charcoal-light text-center py-8">
                  {searchQuery ? 'No templates match your search.' : 'No templates found.'}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="border border-steno-gray-300 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <h3 className="font-heading font-semibold text-lg mb-2 text-steno-navy">{template.name}</h3>
                      <p className="text-sm text-steno-charcoal-light mb-2 line-clamp-3">
                        {template.content.substring(0, 150)}...
                      </p>
                      <div className="text-xs text-steno-gray-500">
                        Variables: {template.variables.join(', ') || 'None'} | Version: {template.version}
                      </div>
                      <div className="text-xs text-steno-gray-500 mt-1">
                        Created: {new Date(template.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Drafts Tab */}
        {activeTab === 'drafts' && (
          <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300">
            <div className="p-4 border-b border-steno-gray-200">
              <h2 className="text-xl font-heading font-semibold text-steno-navy">Letter Drafts</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-steno-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-steno-charcoal">Title</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-steno-charcoal">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-steno-charcoal">Version</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-steno-charcoal">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-steno-charcoal">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-steno-gray-200">
                  {filteredDrafts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-steno-charcoal-light">
                        {searchQuery ? 'No drafts match your search.' : 'No drafts found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredDrafts.map((draft) => (
                      <tr key={draft.id} className="hover:bg-steno-gray-50">
                        <td className="px-4 py-3 text-sm text-steno-charcoal">{draft.title}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded font-medium ${
                            draft.status === 'final' ? 'bg-green-100 text-green-800' :
                            draft.status === 'refined' ? 'bg-blue-100 text-blue-800' :
                            draft.status === 'generated' ? 'bg-steno-teal/10 text-steno-teal-dark' :
                            'bg-steno-gray-100 text-steno-gray-800'
                          }`}>
                            {draft.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-steno-charcoal-light">{draft.version}</td>
                        <td className="px-4 py-3 text-sm text-steno-charcoal-light">
                          {new Date(draft.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-steno-charcoal-light">
                          {new Date(draft.updatedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ContentManagement;


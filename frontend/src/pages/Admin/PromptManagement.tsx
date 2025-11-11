import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { toast } from 'react-toastify';
import AdminLayout from '../../components/AdminLayout';
import { LoadingSpinner } from '../../components/LoadingStates';

interface Prompt {
  id: string;
  name: string;
  type: 'generation' | 'refinement' | 'analysis';
  content: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const PromptManagement: React.FC = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    type: 'generation' as Prompt['type'],
    content: '',
    isDefault: false,
    isActive: true,
  });

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const response = await api.get<{ success: boolean; data: Prompt[] }>('/prompts');
      if (response.data.success) {
        setPrompts(response.data.data || []);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to load prompts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.content) {
      toast.error('Name and content are required');
      return;
    }

    try {
      const response = await api.post<{ success: boolean; data: Prompt }>('/prompts', formData);
      if (response.data.success) {
        toast.success('Prompt created successfully');
        setShowCreateForm(false);
        setFormData({ name: '', type: 'generation', content: '', isDefault: false, isActive: true });
        loadPrompts();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to create prompt');
    }
  };

  const handleUpdate = async () => {
    if (!editingPrompt || !formData.name || !formData.content) {
      toast.error('Name and content are required');
      return;
    }

    try {
      const response = await api.put<{ success: boolean; data: Prompt }>(`/prompts/${editingPrompt.id}`, {
        name: formData.name,
        content: formData.content,
        isDefault: formData.isDefault,
        isActive: formData.isActive,
      });
      if (response.data.success) {
        toast.success('Prompt updated successfully');
        setEditingPrompt(null);
        setFormData({ name: '', type: 'generation', content: '', isDefault: false, isActive: true });
        loadPrompts();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to update prompt');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) return;

    try {
      const response = await api.delete(`/prompts/${id}`);
      if (response.data.success) {
        toast.success('Prompt deleted successfully');
        loadPrompts();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to delete prompt');
    }
  };

  const filteredPrompts = filterType === 'all' 
    ? prompts 
    : prompts.filter(p => p.type === filterType);

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner size="lg" text="Loading prompts..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-heading font-bold text-steno-navy mb-2">AI Prompt Management</h1>
            <p className="text-steno-charcoal-light">
              Customize AI prompts for document analysis, letter generation, and refinement.
            </p>
          </div>
          <button
            onClick={() => {
              setShowCreateForm(true);
              setEditingPrompt(null);
              setFormData({ name: '', type: 'generation', content: '', isDefault: false, isActive: true });
            }}
            className="px-4 py-2 bg-steno-navy text-white rounded-lg hover:bg-steno-navy-dark font-medium transition-colors"
          >
            Create Prompt
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-steno-navy text-white'
                : 'bg-steno-gray-200 text-steno-charcoal hover:bg-steno-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('generation')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'generation'
                ? 'bg-steno-navy text-white'
                : 'bg-steno-gray-200 text-steno-charcoal hover:bg-steno-gray-300'
            }`}
          >
            Generation
          </button>
          <button
            onClick={() => setFilterType('refinement')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'refinement'
                ? 'bg-steno-navy text-white'
                : 'bg-steno-gray-200 text-steno-charcoal hover:bg-steno-gray-300'
            }`}
          >
            Refinement
          </button>
          <button
            onClick={() => setFilterType('analysis')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'analysis'
                ? 'bg-steno-navy text-white'
                : 'bg-steno-gray-200 text-steno-charcoal hover:bg-steno-gray-300'
            }`}
          >
            Analysis
          </button>
        </div>

        {/* Create/Edit Form */}
        {(showCreateForm || editingPrompt) && (
          <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-6">
            <h3 className="text-lg font-heading font-semibold mb-4 text-steno-navy">
              {editingPrompt ? 'Edit Prompt' : 'Create Prompt'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-steno-charcoal mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Aggressive Demand Letter Prompt"
                  className="w-full p-2 border border-steno-gray-300 rounded-lg focus:ring-steno-teal focus:border-steno-teal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-steno-charcoal mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Prompt['type'] })}
                  disabled={!!editingPrompt}
                  className="w-full p-2 border border-steno-gray-300 rounded-lg focus:ring-steno-teal focus:border-steno-teal disabled:bg-steno-gray-100"
                >
                  <option value="generation">Generation</option>
                  <option value="refinement">Refinement</option>
                  <option value="analysis">Analysis</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-steno-charcoal mb-1">
                  Prompt Content
                  <span className="text-xs text-steno-charcoal-light ml-2">
                    (Use variables like {'{{facts}}'}, {'{{parties}}'}, {'{{document_text}}'}, etc.)
                  </span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={12}
                  placeholder="Enter your custom prompt here..."
                  className="w-full p-2 border border-steno-gray-300 rounded-lg focus:ring-steno-teal focus:border-steno-teal font-mono text-sm"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="text-steno-teal focus:ring-steno-teal"
                  />
                  <span className="text-sm text-steno-charcoal">Set as default for this type</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="text-steno-teal focus:ring-steno-teal"
                  />
                  <span className="text-sm text-steno-charcoal">Active</span>
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={editingPrompt ? handleUpdate : handleCreate}
                  className="px-4 py-2 bg-steno-navy text-white rounded-lg hover:bg-steno-navy-dark font-medium transition-colors"
                >
                  {editingPrompt ? 'Update Prompt' : 'Create Prompt'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingPrompt(null);
                    setFormData({ name: '', type: 'generation', content: '', isDefault: false, isActive: true });
                  }}
                  className="px-4 py-2 bg-steno-gray-300 text-steno-charcoal rounded-lg hover:bg-steno-gray-400 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Prompts List */}
        <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300">
          <div className="p-4 border-b border-steno-gray-200">
            <h2 className="text-xl font-heading font-semibold text-steno-navy">
              Prompts ({filteredPrompts.length})
            </h2>
          </div>
          <div className="p-4">
            {filteredPrompts.length === 0 ? (
              <p className="text-steno-charcoal-light text-center py-8">No prompts found.</p>
            ) : (
              <div className="space-y-4">
                {filteredPrompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className="border border-steno-gray-300 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-heading font-semibold text-lg text-steno-navy">{prompt.name}</span>
                          <span className={`px-2 py-1 text-xs rounded font-medium ${
                            prompt.type === 'generation' ? 'bg-steno-teal/10 text-steno-teal-dark' :
                            prompt.type === 'refinement' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {prompt.type}
                          </span>
                          {prompt.isDefault && (
                            <span className="px-2 py-1 text-xs rounded font-medium bg-steno-navy text-white">
                              Default
                            </span>
                          )}
                          {!prompt.isActive && (
                            <span className="px-2 py-1 text-xs rounded font-medium bg-steno-gray-100 text-steno-gray-800">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-steno-charcoal-light mb-2 line-clamp-3 font-mono">
                          {prompt.content.substring(0, 200)}...
                        </div>
                        <div className="text-xs text-steno-gray-500">
                          Created: {new Date(prompt.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingPrompt(prompt);
                            setShowCreateForm(false);
                            setFormData({
                              name: prompt.name,
                              type: prompt.type,
                              content: prompt.content,
                              isDefault: prompt.isDefault,
                              isActive: prompt.isActive,
                            });
                          }}
                          className="px-3 py-1 bg-steno-navy text-white text-sm rounded hover:bg-steno-navy-dark font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(prompt.id)}
                          disabled={prompt.isDefault}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default PromptManagement;


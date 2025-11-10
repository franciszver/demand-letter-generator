import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import { Template } from '../../../shared/types';

interface TemplateManagerProps {
  onSelectTemplate?: (templateId: string) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ onSelectTemplate }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({ name: '', content: '' });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Template[] }>('/templates');
      if (response.data.success) {
        setTemplates(response.data.data || []);
      }
    } catch (error: any) {
      toast.error('Unable to load firm templates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.content) {
      toast.error('Template name and content are required');
      return;
    }

    try {
      const response = await api.post<{ success: boolean; data: Template }>('/templates', formData);
      if (response.data.success) {
        toast.success('Firm template created successfully');
        setShowCreateForm(false);
        setFormData({ name: '', content: '' });
        loadTemplates();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to create template. Please try again.');
    }
  };

  const handleUpdate = async () => {
    if (!editingTemplate || !formData.name || !formData.content) {
      toast.error('Template name and content are required');
      return;
    }

    try {
      const response = await api.put<{ success: boolean; data: Template }>(
        `/templates/${editingTemplate.id}`,
        formData
      );
      if (response.data.success) {
        toast.success('Firm template updated successfully');
        setEditingTemplate(null);
        setFormData({ name: '', content: '' });
        loadTemplates();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to update template. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this firm template? This action cannot be undone.')) return;

    try {
      const response = await api.delete(`/templates/${id}`);
      if (response.data.success) {
        toast.success('Firm template deleted successfully');
        loadTemplates();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to delete template. Please try again.');
    }
  };

  const extractVariables = (content: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    return variables;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-steno-navy mb-2"></div>
        <p className="text-steno-charcoal">Loading firm templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-semibold text-steno-navy">Firm Templates</h2>
          <p className="text-sm text-steno-charcoal-light mt-1">Create and manage reusable letter templates for your firm</p>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(true);
            setEditingTemplate(null);
            setFormData({ name: '', content: '' });
          }}
          className="px-4 py-2 bg-steno-navy text-white rounded-lg hover:bg-steno-navy-dark font-medium transition-colors"
        >
          Create Template
        </button>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingTemplate) && (
        <div className="border border-steno-gray-300 rounded-lg p-6 bg-white shadow-sm">
          <h3 className="text-lg font-heading font-semibold mb-4 text-steno-navy">
            {editingTemplate ? 'Edit Firm Template' : 'Create Firm Template'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-steno-charcoal mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border border-steno-gray-300 rounded-lg focus:ring-steno-teal focus:border-steno-teal"
                placeholder="e.g., Standard Demand Letter, Personal Injury Template"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-steno-charcoal mb-1">
                Template Content (use {'{{variable_name}}'} for placeholders)
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full p-2 border border-steno-gray-300 rounded-lg focus:ring-steno-teal focus:border-steno-teal"
                rows={10}
                placeholder="Enter template content with variables like {{client_name}}, {{date}}, {{amount}}, etc."
              />
              {formData.content && (
                <div className="mt-2 text-sm text-steno-teal-dark">
                  Variables found: {extractVariables(formData.content).join(', ') || 'None'}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={editingTemplate ? handleUpdate : handleCreate}
                className="px-4 py-2 bg-steno-navy text-white rounded-lg hover:bg-steno-navy-dark font-medium transition-colors"
              >
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingTemplate(null);
                  setFormData({ name: '', content: '' });
                }}
                className="px-4 py-2 bg-steno-gray-300 text-steno-charcoal rounded-lg hover:bg-steno-gray-400 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="border border-steno-gray-300 rounded-lg p-4 bg-white hover:shadow-lg transition-all hover:border-steno-teal"
          >
            <h3 className="font-heading font-semibold text-lg mb-2 text-steno-navy">{template.name}</h3>
            <p className="text-sm text-steno-charcoal-light mb-2 line-clamp-3">
              {template.content.substring(0, 150)}...
            </p>
            <div className="text-xs text-steno-gray-500 mb-3">
              Variables: {template.variables.join(', ') || 'None'}
            </div>
            <div className="flex gap-2">
              {onSelectTemplate && (
                <button
                  onClick={() => onSelectTemplate(template.id)}
                  className="px-3 py-1 bg-steno-teal text-white text-sm rounded hover:bg-steno-teal-dark font-medium transition-colors"
                >
                  Use Template
                </button>
              )}
              <button
                onClick={() => {
                  setEditingTemplate(template);
                  setFormData({ name: template.name, content: template.content });
                  setShowCreateForm(false);
                }}
                className="px-3 py-1 bg-steno-navy text-white text-sm rounded hover:bg-steno-navy-dark font-medium transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(template.id)}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-16 w-16 text-steno-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-heading font-semibold text-steno-charcoal mb-2">No firm templates yet</h3>
          <p className="text-steno-charcoal-light">Create your first template to standardize demand letters across your firm.</p>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;


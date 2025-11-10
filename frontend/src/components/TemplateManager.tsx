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
      toast.error('Failed to load templates');
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
      const response = await api.post<{ success: boolean; data: Template }>('/templates', formData);
      if (response.data.success) {
        toast.success('Template created successfully');
        setShowCreateForm(false);
        setFormData({ name: '', content: '' });
        loadTemplates();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create template');
    }
  };

  const handleUpdate = async () => {
    if (!editingTemplate || !formData.name || !formData.content) {
      toast.error('Name and content are required');
      return;
    }

    try {
      const response = await api.put<{ success: boolean; data: Template }>(
        `/templates/${editingTemplate.id}`,
        formData
      );
      if (response.data.success) {
        toast.success('Template updated successfully');
        setEditingTemplate(null);
        setFormData({ name: '', content: '' });
        loadTemplates();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update template');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await api.delete(`/templates/${id}`);
      if (response.data.success) {
        toast.success('Template deleted successfully');
        loadTemplates();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete template');
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
    return <div className="text-center py-8">Loading templates...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Templates</h2>
        <button
          onClick={() => {
            setShowCreateForm(true);
            setEditingTemplate(null);
            setFormData({ name: '', content: '' });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Template
        </button>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingTemplate) && (
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <h3 className="text-lg font-semibold mb-4">
            {editingTemplate ? 'Edit Template' : 'Create Template'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Standard Demand Letter"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Content (use {'{{variable_name}}'} for placeholders)
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                rows={10}
                placeholder="Enter template content with variables like {{client_name}}, {{date}}, etc."
              />
              {formData.content && (
                <div className="mt-2 text-sm text-gray-600">
                  Variables found: {extractVariables(formData.content).join(', ') || 'None'}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={editingTemplate ? handleUpdate : handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingTemplate ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingTemplate(null);
                  setFormData({ name: '', content: '' });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
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
            className="border border-gray-300 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
            <p className="text-sm text-gray-600 mb-2 line-clamp-3">
              {template.content.substring(0, 150)}...
            </p>
            <div className="text-xs text-gray-500 mb-3">
              Variables: {template.variables.join(', ') || 'None'}
            </div>
            <div className="flex gap-2">
              {onSelectTemplate && (
                <button
                  onClick={() => onSelectTemplate(template.id)}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Use
                </button>
              )}
              <button
                onClick={() => {
                  setEditingTemplate(template);
                  setFormData({ name: template.name, content: template.content });
                  setShowCreateForm(false);
                }}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(template.id)}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No templates yet. Create your first template to get started.
        </div>
      )}
    </div>
  );
};

export default TemplateManager;


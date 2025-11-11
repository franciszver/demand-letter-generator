import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { toast } from 'react-toastify';
import AdminLayout from '../../components/AdminLayout';
import { LoadingSpinner } from '../../components/LoadingStates';

interface Webhook {
  id: string;
  userId: string;
  url: string;
  events: string[];
  secret: string | null;
  active: boolean;
  retryCount: number;
  lastTriggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const AVAILABLE_EVENTS = [
  'letter.created',
  'letter.updated',
  'letter.exported',
  'letter.refined',
  'template.created',
  'template.updated',
  'template.deleted',
];

const Webhooks: React.FC = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [formData, setFormData] = useState({ url: '', events: [] as string[], secret: '' });

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    setLoading(true);
    try {
      const response = await api.get<{ success: boolean; data: Webhook[] }>('/webhooks');
      if (response.data.success) {
        setWebhooks(response.data.data || []);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.url || formData.events.length === 0) {
      toast.error('URL and at least one event are required');
      return;
    }

    try {
      const response = await api.post<{ success: boolean; data: Webhook }>('/webhooks', {
        url: formData.url,
        events: formData.events,
        secret: formData.secret || undefined,
      });
      if (response.data.success) {
        toast.success('Webhook created successfully');
        setShowCreateForm(false);
        setFormData({ url: '', events: [], secret: '' });
        loadWebhooks();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to create webhook');
    }
  };

  const handleUpdate = async () => {
    if (!editingWebhook || !formData.url || formData.events.length === 0) {
      toast.error('URL and at least one event are required');
      return;
    }

    try {
      const response = await api.put<{ success: boolean; data: Webhook }>(`/webhooks/${editingWebhook.id}`, {
        url: formData.url,
        events: formData.events,
        active: editingWebhook.active,
      });
      if (response.data.success) {
        toast.success('Webhook updated successfully');
        setEditingWebhook(null);
        setFormData({ url: '', events: [], secret: '' });
        loadWebhooks();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to update webhook');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const response = await api.delete(`/webhooks/${id}`);
      if (response.data.success) {
        toast.success('Webhook deleted successfully');
        loadWebhooks();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to delete webhook');
    }
  };

  const handleTest = async (id: string) => {
    try {
      const response = await api.post(`/webhooks/${id}/test`);
      if (response.data.success) {
        toast.success('Test webhook sent successfully');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to send test webhook');
    }
  };

  const toggleEvent = (event: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event],
    }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner size="lg" text="Loading webhooks..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-heading font-bold text-steno-navy mb-2">Webhook Management</h1>
            <p className="text-steno-charcoal-light">
              Configure webhooks to receive real-time notifications when events occur in Steno Draft.
            </p>
          </div>
          <button
            onClick={() => {
              setShowCreateForm(true);
              setEditingWebhook(null);
              setFormData({ url: '', events: [], secret: '' });
            }}
            className="px-4 py-2 bg-steno-navy text-white rounded-lg hover:bg-steno-navy-dark font-medium transition-colors"
          >
            Create Webhook
          </button>
        </div>

        {/* Create/Edit Form */}
        {(showCreateForm || editingWebhook) && (
          <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-6">
            <h3 className="text-lg font-heading font-semibold mb-4 text-steno-navy">
              {editingWebhook ? 'Edit Webhook' : 'Create Webhook'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-steno-charcoal mb-1">Webhook URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://your-server.com/webhook"
                  className="w-full p-2 border border-steno-gray-300 rounded-lg focus:ring-steno-teal focus:border-steno-teal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-steno-charcoal mb-2">Events to Listen For</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {AVAILABLE_EVENTS.map((event) => (
                    <label key={event} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.events.includes(event)}
                        onChange={() => toggleEvent(event)}
                        className="text-steno-teal focus:ring-steno-teal"
                      />
                      <span className="text-sm text-steno-charcoal">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
              {!editingWebhook && (
                <div>
                  <label className="block text-sm font-medium text-steno-charcoal mb-1">
                    Webhook Secret (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.secret}
                    onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                    placeholder="Leave empty to auto-generate"
                    className="w-full p-2 border border-steno-gray-300 rounded-lg focus:ring-steno-teal focus:border-steno-teal"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={editingWebhook ? handleUpdate : handleCreate}
                  className="px-4 py-2 bg-steno-navy text-white rounded-lg hover:bg-steno-navy-dark font-medium transition-colors"
                >
                  {editingWebhook ? 'Update Webhook' : 'Create Webhook'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingWebhook(null);
                    setFormData({ url: '', events: [], secret: '' });
                  }}
                  className="px-4 py-2 bg-steno-gray-300 text-steno-charcoal rounded-lg hover:bg-steno-gray-400 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Webhooks List */}
        <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300">
          <div className="p-4 border-b border-steno-gray-200">
            <h2 className="text-xl font-heading font-semibold text-steno-navy">Webhooks ({webhooks.length})</h2>
          </div>
          <div className="p-4">
            {webhooks.length === 0 ? (
              <p className="text-steno-charcoal-light text-center py-8">No webhooks configured.</p>
            ) : (
              <div className="space-y-4">
                {webhooks.map((webhook) => (
                  <div
                    key={webhook.id}
                    className="border border-steno-gray-300 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-steno-charcoal">{webhook.url}</span>
                          <span className={`px-2 py-1 text-xs rounded font-medium ${
                            webhook.active ? 'bg-green-100 text-green-800' : 'bg-steno-gray-100 text-steno-gray-800'
                          }`}>
                            {webhook.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="text-sm text-steno-charcoal-light mb-2">
                          Events: {webhook.events.join(', ')}
                        </div>
                        {webhook.lastTriggeredAt && (
                          <div className="text-xs text-steno-gray-500">
                            Last triggered: {new Date(webhook.lastTriggeredAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTest(webhook.id)}
                          className="px-3 py-1 bg-steno-teal text-white text-sm rounded hover:bg-steno-teal-dark font-medium transition-colors"
                        >
                          Test
                        </button>
                        <button
                          onClick={() => {
                            setEditingWebhook(webhook);
                            setShowCreateForm(false);
                            setFormData({ url: webhook.url, events: webhook.events, secret: '' });
                          }}
                          className="px-3 py-1 bg-steno-navy text-white text-sm rounded hover:bg-steno-navy-dark font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(webhook.id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 font-medium transition-colors"
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

export default Webhooks;


import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);

  const handleExportData = async () => {
    setExporting(true);
    try {
      const response = await api.get('/user/data-export', {
        responseType: 'json',
      });

      // Create download link
      const jsonString = JSON.stringify(response.data, null, 2);
      const blob = new Blob([jsonString], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Data export downloaded successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-steno-gray-50">
      <nav className="bg-white shadow-sm border-b border-steno-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="text-steno-teal hover:text-steno-teal-dark font-medium transition-colors">
              ← Back to Home
            </Link>
            <h1 className="text-xl font-heading font-bold text-steno-navy">Settings</h1>
            <div></div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          {/* Account Information */}
          <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-6">
            <h2 className="text-xl font-heading font-semibold text-steno-navy mb-4">Account Information</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-steno-charcoal mb-1">Name</label>
                <div className="text-steno-charcoal">{user?.name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-steno-charcoal mb-1">Email</label>
                <div className="text-steno-charcoal">{user?.email}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-steno-charcoal mb-1">Role</label>
                <div className="text-steno-charcoal capitalize">{user?.role}</div>
              </div>
            </div>
          </div>

          {/* Privacy & Data */}
          <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-6">
            <h2 className="text-xl font-heading font-semibold text-steno-navy mb-4">Privacy & Data</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-steno-charcoal mb-2">Data Export</h3>
                <p className="text-sm text-steno-charcoal-light mb-3">
                  Download a copy of all your data in JSON format (GDPR compliant).
                </p>
                <button
                  onClick={handleExportData}
                  disabled={exporting}
                  className="px-4 py-2 bg-steno-teal text-white rounded-lg hover:bg-steno-teal-dark disabled:opacity-50 font-medium transition-colors"
                >
                  {exporting ? 'Exporting...' : 'Export My Data'}
                </button>
              </div>
              <div className="pt-4 border-t border-steno-gray-200">
                <h3 className="font-medium text-steno-charcoal mb-2">Privacy Policy</h3>
                <p className="text-sm text-steno-charcoal-light mb-3">
                  Review our privacy policy to understand how we handle your data.
                </p>
                <Link
                  to="/privacy"
                  className="text-steno-teal hover:text-steno-teal-dark font-medium"
                >
                  View Privacy Policy →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;


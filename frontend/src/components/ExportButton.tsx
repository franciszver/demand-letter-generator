import React, { useState } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';

interface ExportButtonProps {
  draftId: string;
  disabled?: boolean;
}

const ExportButton: React.FC<ExportButtonProps> = ({ draftId, disabled }) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!draftId) {
      toast.error('No letter draft available to export');
      return;
    }

    setExporting(true);
    try {
      const response = await api.post<{ success: boolean; data: { downloadUrl: string; expiresAt: string } }>(
        '/export',
        { draftId }
      );

      if (response.data.success && response.data.data) {
        // Open download URL in new tab
        window.open(response.data.data.downloadUrl, '_blank');
        toast.success('Word document generated successfully. Download will begin shortly.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to export letter. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || exporting}
      className="px-6 py-2 bg-steno-teal text-white rounded-lg hover:bg-steno-teal-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
    >
      {exporting ? (
        <>
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Generating Word document...
        </>
      ) : (
        <>
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export to Word
        </>
      )}
    </button>
  );
};

export default ExportButton;


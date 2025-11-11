import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { UserProfile, CaseContext } from '../../../shared/types';
import { toast } from 'react-toastify';

interface EQDataFormProps {
  userId: string;
  draftLetterId?: string;
  onSave?: (caseContext?: Partial<CaseContext>) => void;
  mode?: 'user-profile' | 'case-context' | 'both';
  onCaseContextChange?: (context: Partial<CaseContext>) => void;
}

const EQDataForm: React.FC<EQDataFormProps> = ({ userId, draftLetterId, onSave, mode = 'both', onCaseContextChange }) => {
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({
    formalityLevel: 7,
    urgencyTendency: 5,
    empathyPreference: 5,
  });
  const [caseContext, setCaseContext] = useState<Partial<CaseContext>>({
    urgencyLevel: 5,
  });

  // Notify parent of case context changes
  useEffect(() => {
    if (onCaseContextChange && (mode === 'case-context' || mode === 'both')) {
      onCaseContextChange(caseContext);
    }
  }, [caseContext, mode, onCaseContextChange]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get(`/user-profiles/${userId}`);
        if (response.data.success && response.data.data) {
          setUserProfile(response.data.data);
        }
      } catch (error) {
        // Profile might not exist yet
        console.log('No user profile found');
      }
    };

    if (mode === 'user-profile' || mode === 'both') {
      fetchUserProfile();
    }

    if (draftLetterId && (mode === 'case-context' || mode === 'both')) {
      // Fetch case context if draft exists
      // This would need a new endpoint
    }
  }, [userId, draftLetterId, mode]);

  const handleSaveUserProfile = async () => {
    try {
      setSaving(true);
      await api.post('/user-profiles', userProfile);
      toast.success('User profile saved successfully');
      onSave?.();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save user profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCaseContext = async () => {
    try {
      setSaving(true);
      // Case context will be saved with the draft during generation
      toast.success('Case context will be saved with the draft');
      onSave?.(caseContext);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save case context');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {(mode === 'user-profile' || mode === 'both') && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">User Profile Preferences</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Communication Style
              </label>
              <select
                value={userProfile.communicationStyle || ''}
                onChange={(e) => setUserProfile({ ...userProfile, communicationStyle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select style</option>
                <option value="direct">Direct</option>
                <option value="diplomatic">Diplomatic</option>
                <option value="collaborative">Collaborative</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Tone
              </label>
              <select
                value={userProfile.preferredTone || ''}
                onChange={(e) => setUserProfile({ ...userProfile, preferredTone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select tone</option>
                <option value="formal">Formal</option>
                <option value="informal">Informal</option>
                <option value="assertive">Assertive</option>
                <option value="passive">Passive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Formality Level: {userProfile.formalityLevel}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={userProfile.formalityLevel || 7}
                onChange={(e) => setUserProfile({ ...userProfile, formalityLevel: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Urgency Tendency: {userProfile.urgencyTendency}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={userProfile.urgencyTendency || 5}
                onChange={(e) => setUserProfile({ ...userProfile, urgencyTendency: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Empathy Preference: {userProfile.empathyPreference}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={userProfile.empathyPreference || 5}
                onChange={(e) => setUserProfile({ ...userProfile, empathyPreference: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                value={userProfile.notes || ''}
                onChange={(e) => setUserProfile({ ...userProfile, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="Any additional preferences or notes..."
              />
            </div>

            <button
              onClick={handleSaveUserProfile}
              disabled={saving}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save User Profile'}
            </button>
          </div>
        </div>
      )}

      {(mode === 'case-context' || mode === 'both') && draftLetterId && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Case-Specific Context</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship Dynamics
              </label>
              <textarea
                value={caseContext.relationshipDynamics || ''}
                onChange={(e) => setCaseContext({ ...caseContext, relationshipDynamics: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={2}
                placeholder="Describe the relationship dynamics with the recipient..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Urgency Level: {caseContext.urgencyLevel}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={caseContext.urgencyLevel || 5}
                onChange={(e) => setCaseContext({ ...caseContext, urgencyLevel: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Previous Interactions
              </label>
              <textarea
                value={caseContext.previousInteractions || ''}
                onChange={(e) => setCaseContext({ ...caseContext, previousInteractions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={2}
                placeholder="History of previous communications..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Case Sensitivity
              </label>
              <select
                value={caseContext.caseSensitivity || ''}
                onChange={(e) => setCaseContext({ ...caseContext, caseSensitivity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select sensitivity</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Recipient Role
                </label>
                <input
                  type="text"
                  value={caseContext.targetRecipientRole || ''}
                  onChange={(e) => setCaseContext({ ...caseContext, targetRecipientRole: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., CEO, Attorney"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Organization
                </label>
                <input
                  type="text"
                  value={caseContext.targetRecipientOrg || ''}
                  onChange={(e) => setCaseContext({ ...caseContext, targetRecipientOrg: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Organization name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Relationship
              </label>
              <select
                value={caseContext.targetRelationship || ''}
                onChange={(e) => setCaseContext({ ...caseContext, targetRelationship: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select relationship</option>
                <option value="adversary">Adversary</option>
                <option value="client">Client</option>
                <option value="colleague">Colleague</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>

            <button
              onClick={handleSaveCaseContext}
              disabled={saving}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Case Context'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EQDataForm;


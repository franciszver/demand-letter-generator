import React from 'react';
import { LetterMetrics } from '../../../shared/types';

interface MetricsMetersProps {
  metrics: LetterMetrics;
  showLabels?: boolean;
  compact?: boolean;
}

const MetricsMeters: React.FC<MetricsMetersProps> = ({ metrics, showLabels = true, compact = false }) => {
  const getColor = (value: number): string => {
    if (value >= 8) return 'bg-red-500';
    if (value >= 6) return 'bg-yellow-500';
    if (value >= 4) return 'bg-green-500';
    return 'bg-gray-400';
  };

  const getLabel = (key: keyof LetterMetrics): string => {
    const labels: Record<string, string> = {
      intensity: 'Intensity',
      seriousness: 'Seriousness',
      formality: 'Formality',
      clarity: 'Clarity',
      persuasiveness: 'Persuasiveness',
      empathy: 'Empathy',
      structureQuality: 'Structure',
      legalPrecision: 'Legal Precision',
    };
    return labels[key] || key;
  };

  const metricKeys: Array<keyof LetterMetrics> = [
    'intensity',
    'seriousness',
    'formality',
    'clarity',
    'persuasiveness',
    'empathy',
    'structureQuality',
    'legalPrecision',
  ].filter(key => key !== 'id' && key !== 'draftLetterId' && key !== 'calculatedAt' && key !== 'createdAt' && key !== 'updatedAt') as Array<keyof LetterMetrics>;

  if (compact) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {metricKeys.map((key) => {
          const value = metrics[key] as number;
          return (
            <div key={key} className="text-center">
              {showLabels && (
                <div className="text-xs text-gray-600 mb-1">{getLabel(key)}</div>
              )}
              <div className="flex items-center justify-center">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getColor(value)}`}
                    style={{ width: `${(value / 10) * 100}%` }}
                  />
                </div>
                <span className="ml-2 text-xs font-semibold">{value}/10</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {metricKeys.map((key) => {
        const value = metrics[key] as number;
        return (
          <div key={key} className="space-y-1">
            {showLabels && (
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">{getLabel(key)}</span>
                <span className="text-gray-600">{value}/10</span>
              </div>
            )}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${getColor(value)}`}
                style={{ width: `${(value / 10) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MetricsMeters;


import React from 'react';

interface AdminMetricsProps {
  totalUsers: number;
  totalLetters: number;
  totalDocuments: number;
  totalTimeSaved: number;
  averageTimeSaved: number;
  lettersGeneratedToday: number;
  lettersGeneratedThisWeek: number;
  lettersGeneratedThisMonth: number;
  activeUsers: number;
}

const AdminMetrics: React.FC<AdminMetricsProps> = ({
  totalUsers,
  totalLetters,
  totalDocuments,
  totalTimeSaved,
  averageTimeSaved,
  lettersGeneratedToday,
  lettersGeneratedThisWeek,
  lettersGeneratedThisMonth,
  activeUsers,
}) => {
  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h ${minutes % 60}m`;
  };

  const statCards = [
    { label: 'Total Users', value: totalUsers, color: 'blue' },
    { label: 'Total Letters', value: totalLetters, color: 'green' },
    { label: 'Total Documents', value: totalDocuments, color: 'purple' },
    { label: 'Active Users (30d)', value: activeUsers, color: 'indigo' },
  ];

  const timeCards = [
    { label: 'Total Time Saved', value: formatTime(totalTimeSaved), color: 'green' },
    { label: 'Avg Time per Letter', value: formatTime(averageTimeSaved), color: 'blue' },
  ];

  const letterCards = [
    { label: 'Today', value: lettersGeneratedToday },
    { label: 'This Week', value: lettersGeneratedThisWeek },
    { label: 'This Month', value: lettersGeneratedThisMonth },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    };
    return colors[color] || 'bg-gray-50 border-gray-200 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`p-4 rounded-lg border-2 ${getColorClasses(card.color)}`}
          >
            <div className="text-sm font-medium opacity-75">{card.label}</div>
            <div className="text-2xl font-bold mt-1">{card.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Time Saved Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {timeCards.map((card) => (
          <div
            key={card.label}
            className={`p-6 rounded-lg border-2 ${getColorClasses(card.color)}`}
          >
            <div className="text-sm font-medium opacity-75">{card.label}</div>
            <div className="text-3xl font-bold mt-2">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Letter Generation Stats */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Letter Generation</h3>
        <div className="grid grid-cols-3 gap-4">
          {letterCards.map((card) => (
            <div key={card.label} className="text-center">
              <div className="text-2xl font-bold text-gray-800">{card.value}</div>
              <div className="text-sm text-gray-600 mt-1">{card.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminMetrics;


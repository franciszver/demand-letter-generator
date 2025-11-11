import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`inline-block animate-spin rounded-full border-b-2 border-steno-navy ${sizeClasses[size]}`}></div>
      {text && (
        <p className="mt-2 text-steno-charcoal text-sm">{text}</p>
      )}
    </div>
  );
};

interface LoadingCardProps {
  message?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-8">
      <LoadingSpinner size="lg" text={message} />
    </div>
  );
};

interface LoadingPageProps {
  message?: string;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({ message = 'Loading Steno Draft...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-steno-gray-50">
      <LoadingSpinner size="lg" text={message} />
    </div>
  );
};

interface SkeletonLoaderProps {
  lines?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ lines = 3, className = '' }) => {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-steno-gray-200 rounded"
          style={{ width: i === lines - 1 ? '75%' : '100%' }}
        />
      ))}
    </div>
  );
};


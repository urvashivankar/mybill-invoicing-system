// src/components/ui/ProgressBar.tsx
import React from 'react';

interface ProgressBarProps {
  percent: number; // 0 - 100
  color?: string; // optional CSS color, defaults to primary
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ percent, color = 'var(--primary-color)', className = '' }) => {
  const safePercent = Math.min(100, Math.max(0, percent));
  return (
    <div className={`w-full bg-gray-200 rounded-full h-3 overflow-hidden ${className}`}> 
      <div
        style={{ width: `${safePercent}%`, backgroundColor: color }}
        className="h-3"
      />
    </div>
  );
};

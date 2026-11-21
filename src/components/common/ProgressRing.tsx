import React from 'react';

interface ProgressRingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
  strokeColor?: string;
  trackColorClass?: string;
  children?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 160,
  strokeWidth = 12,
  strokeColor = '#0284C7',
  trackColorClass = 'stroke-slate-200 dark:stroke-slate-800',
  children,
}) => {
  const clamped = Math.max(0, Math.min(1, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - clamped * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center select-none"
      style={{width: size, height: size}}
    >
      <svg width={size} height={size} className="-rotate-90 transform" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={trackColorClass}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 450ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
          {children}
        </div>
      )}
    </div>
  );
};

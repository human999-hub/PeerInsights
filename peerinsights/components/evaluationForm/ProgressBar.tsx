// components/evaluationForm/ProgressBar.tsx
'use client';
import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = Math.round(((current + 1) / total) * 100);
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1 text-sm text-gray-600">
        <span>{`Page ${current + 1} of ${total}`}</span>
        <span>{`${percentage}% complete`}</span>
      </div>
      <div className="w-full bg-gray-300 h-2 rounded-full">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

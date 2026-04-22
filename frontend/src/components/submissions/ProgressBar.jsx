import React from 'react';

const ProgressBar = ({ value, label, color = "bg-violet-600", secondaryLabel }) => {
  const percentage = Math.min(Math.max(value, 0), 100);

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
        <span>{label}</span>
        <span>{secondaryLabel || `${percentage}%`}</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;

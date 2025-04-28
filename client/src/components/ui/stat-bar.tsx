import React from 'react';

interface StatBarProps {
  value: number;
  maxValue: number;
  color?: string;
  backgroundColor?: string;
}

const StatBar: React.FC<StatBarProps> = ({
  value,
  maxValue,
  color = 'linear-gradient(90deg, #4169E1, #8ca9ff)',
  backgroundColor = '#222'
}) => {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
  
  return (
    <div className="stat-bar bg-gray-900 rounded-sm overflow-hidden" style={{ backgroundColor }}>
      <div 
        className="stat-fill" 
        style={{ 
          width: `${percentage}%`,
          background: color,
        }}
      />
    </div>
  );
};

export default StatBar;

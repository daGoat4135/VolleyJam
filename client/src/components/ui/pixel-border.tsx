import React from 'react';

interface PixelBorderProps {
  children: React.ReactNode;
  color?: string;
}

export const PixelBorder: React.FC<PixelBorderProps> = ({ 
  children, 
  color = '#FFD700' 
}) => {
  return (
    <div className="pixel-border" style={{
      boxShadow: `0 0 0 2px #000, 0 0 0 4px ${color}`
    }}>
      {children}
    </div>
  );
};

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
      boxShadow: `inset 0 0 0 2px #000, inset 0 0 0 4px ${color}` // Changed to inset box-shadow
    }}>
      {children}
    </div>
  );
};
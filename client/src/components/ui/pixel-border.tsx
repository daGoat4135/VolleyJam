
import React from 'react';

interface PixelBorderProps {
  children: React.ReactNode;
  color?: string;
}

export const PixelBorder: React.FC<PixelBorderProps> = ({ 
  children
}) => {
  return (
    <div>
      {children}
    </div>
  );
};

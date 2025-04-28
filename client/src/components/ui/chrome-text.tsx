import React from 'react';

interface ChromeTextProps {
  children: React.ReactNode;
  className?: string;
}

export const ChromeText: React.FC<ChromeTextProps> = ({ children, className = '' }) => {
  return (
    <span className={`chrome-text ${className}`}>
      {children}
    </span>
  );
};

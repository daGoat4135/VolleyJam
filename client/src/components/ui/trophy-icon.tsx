
import React from 'react';

export const TrophyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="9" y="3" width="6" height="2" fill="currentColor" />
    <rect x="7" y="5" width="10" height="2" fill="currentColor" />
    <rect x="6" y="7" width="12" height="2" fill="currentColor" />
    <rect x="8" y="9" width="8" height="2" fill="currentColor" />
    <rect x="10" y="11" width="4" height="2" fill="currentColor" />
    <rect x="9" y="13" width="6" height="2" fill="currentColor" />
    <rect x="8" y="15" width="8" height="2" fill="currentColor" />
    <rect x="10" y="17" width="4" height="4" fill="currentColor" />
  </svg>
);

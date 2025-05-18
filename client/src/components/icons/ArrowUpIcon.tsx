import React from 'react';

interface IconProps {
  className?: string;
}

export function ArrowUpIcon({ className = "" }: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M11.9995 19V6M11.9995 6L7 11M11.9995 6L17 11.0005" 
        stroke="white" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
} 
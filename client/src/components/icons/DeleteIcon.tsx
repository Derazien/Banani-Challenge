import React from 'react';

interface IconProps {
  className?: string;
}

export function DeleteIcon({ className = "" }: IconProps) {
  return (
    <svg 
      width="12" 
      height="14" 
      viewBox="0 0 12 14" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M2.25 14C1.8375 14 1.48438 13.8477 1.19063 13.5431C0.896875 13.2384 0.75 12.8722 0.75 12.4444V2.33333H0V0.777778H3.75V0H8.25V0.777778H12V2.33333H11.25V12.4444C11.25 12.8722 11.1031 13.2384 10.8094 13.5431C10.5156 13.8477 10.1625 14 9.75 14H2.25ZM9.75 2.33333H2.25V12.4444H9.75V2.33333ZM3.75 10.8889H5.25V3.88889H3.75V10.8889ZM6.75 10.8889H8.25V3.88889H6.75V10.8889Z" 
        fill="currentColor"
      />
    </svg>
  );
} 
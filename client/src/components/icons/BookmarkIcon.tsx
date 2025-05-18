import React from 'react';

interface IconProps {
  className?: string;
}

export function BookmarkIcon({ className = "" }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M17.5 3.5H6.5C5.6 3.5 5 4.1 5 5V19C5 19.9 5.6 20.5 6.5 20.5H17.5C18.4 20.5 19 19.9 19 19V5C19 4.1 18.4 3.5 17.5 3.5ZM17.5 19H12L8.5 15.5V19H6.5V5H17.5V19Z" fill="currentColor"/>
    </svg>
  );
} 
import React from 'react';

interface IconProps {
  className?: string;
}

export function ChatBubbleIcon({ className = "" }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 22L6 18H20C21.1 18 22 17.1 22 16V6C22 4.9 21.1 4 20 4ZM20 16H5.17L4.58 16.59L4 17.17V6H20V16Z" fill="currentColor"/>
    </svg>
  );
} 
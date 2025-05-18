import React from 'react';

interface IconProps {
  className?: string;
}

export function DnsIcon({ className = "" }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M20 13H4C2.9 13 2 13.9 2 15V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V15C22 13.9 21.1 13 20 13ZM20 19H4V15H20V19ZM20 3H4C2.9 3 2 3.9 2 5V9C2 10.1 2.9 11 4 11H20C21.1 11 22 10.1 22 9V5C22 3.9 21.1 3 20 3ZM20 9H4V5H20V9ZM8 7H7V7.5H6.5V6.5H7.5V6H6V5.5H7V5H6.5V4.5H8V7ZM12 5.5H10.5V7H10V5.5H8.5V5H12V5.5ZM18 6H16.5V6.5H18V7H14.5V6.5H16V6H14.5V5.5H18V6Z" fill="currentColor"/>
    </svg>
  );
} 
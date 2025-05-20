'use client';

import React, { useState, useEffect } from 'react';

interface ErrorAlertProps {
  message: string;
  title?: string;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorAlert({
  message,
  title = 'Error',
  onDismiss,
  className = ''
}: ErrorAlertProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  // Handle dismiss with animation
  const handleDismiss = () => {
    setIsLeaving(true);
    
    setTimeout(() => {
      setIsVisible(false);
      if (onDismiss) onDismiss();
    }, 300);
  };

  return (
    <div 
      className={`
        bg-white border-l-4 border-red-500 p-4 rounded-md shadow-md 
        transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-4'}
        ${isLeaving ? 'opacity-0 transform translate-y-2' : ''}
        ${className}
      `}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-0.5">
          <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-md font-medium text-red-800">{title}</h3>
          <div className="mt-1 text-sm text-red-700">
            {message}
          </div>
        </div>
        {onDismiss && (
          <button 
            type="button" 
            className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg p-1.5"
            onClick={handleDismiss}
            aria-label="Dismiss"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
} 
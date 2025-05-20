'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  color = 'blue-600',
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <svg
        className={`animate-spin ${sizeClasses[size]} text-${color}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
  );
}

interface LoadingOverlayProps {
  message?: string;
  className?: string;
}

export function LoadingOverlay({
  message = 'Loading...',
  className = ''
}: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      <motion.div 
        className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center"
          initial={{ scale: 0.8, y: 10, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 20,
            delay: 0.1 
          }}
        >
          <LoadingSpinner size="lg" />
          <motion.p 
            className="mt-4 text-gray-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {message}
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className={cn(
            "bg-white dark:bg-slate-900 border-l-4 border-red-500 p-5 rounded-lg shadow-lg relative overflow-hidden",
            isLeaving ? "opacity-0 transform translate-y-2" : "",
            className
          )}
          role="alert"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 20
          }}
        >
          {/* Animated background */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-red-100/20 via-transparent to-transparent dark:from-red-900/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          />
          
          <div className="flex items-start relative z-10">
            <div className="flex-shrink-0">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </motion.div>
            </div>
            <div className="ml-3 flex-1">
              <motion.h3 
                className="text-md font-semibold text-red-800 dark:text-red-400"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {title}
              </motion.h3>
              <motion.div 
                className="mt-2 text-sm text-red-700 dark:text-red-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {message}
              </motion.div>
            </div>
            {onDismiss && (
              <motion.button 
                type="button" 
                className="ml-auto text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-full p-1.5 focus:outline-none transition-colors duration-200"
                onClick={handleDismiss}
                aria-label="Dismiss"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ delay: 0.4 }}
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            )}
          </div>
          
          {/* Pulsing warning line at bottom */}
          <motion.div 
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500/50"
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
} 
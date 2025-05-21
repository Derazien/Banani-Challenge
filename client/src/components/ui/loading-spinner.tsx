'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  variant?: 'default' | 'glow' | 'dots';
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  color = 'blue-600',
  variant = 'default',
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  
  if (variant === 'dots') {
    return (
      <div className={cn("flex justify-center items-center space-x-2", className)}>
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className={cn(`rounded-full bg-${color}`, {
              'w-2 h-2': size === 'sm',
              'w-3 h-3': size === 'md',
              'w-4 h-4': size === 'lg'
            })}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    );
  }
  
  if (variant === 'glow') {
    return (
      <div className={cn("relative flex justify-center items-center", className)}>
        <div className={cn(`rounded-full bg-${color}/20`, sizeClasses[size])}></div>
        <motion.div 
          className={cn(`absolute inset-0 rounded-full bg-${color}/40`, sizeClasses[size])}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className={cn(`absolute inset-0 rounded-full bg-${color}`, sizeClasses[size])}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            clipPath: 'polygon(50% 0%, 50% 50%, 100% 0%)'
          }}
        />
      </div>
    );
  }
  
  // Default spinner (circular)
  return (
    <div className={cn("flex justify-center items-center", className)}>
      <svg
        className={cn(`animate-spin ${sizeClasses[size]} text-${color}`)}
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
          strokeWidth="3"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
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
        className={cn("fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50", className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className="bg-slate-800/80 p-8 rounded-2xl backdrop-blur-sm shadow-xl flex flex-col items-center relative overflow-hidden border border-indigo-500/20"
          initial={{ scale: 0.8, y: 10, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 20,
            delay: 0.1 
          }}
        >
          <div className="absolute inset-0 overflow-hidden">
            {/* Pulsing gradients */}
            <motion.div 
              className="absolute -inset-[100%] opacity-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              style={{
                background: 'conic-gradient(from 230.29deg at 51.63% 52.16%, rgb(36, 0, 255) 0deg, rgb(0, 135, 255) 67.5deg, rgb(108, 39, 157) 198.75deg, rgb(24, 38, 163) 251.25deg, rgb(54, 103, 196) 301.88deg, rgb(105, 30, 255) 360deg)',
                zIndex: -10
              }}
            >
              <motion.div 
                animate={{ 
                  rotate: 360,
                }} 
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute inset-0" 
              />
            </motion.div>
          </div>
          
          <div className="mb-4">
            <LoadingSpinner 
              size="lg" 
              variant="glow" 
              color="indigo-500"
            />
          </div>
          
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.p 
              className="text-indigo-200 font-medium"
              animate={{ 
                opacity: [0.7, 1, 0.7] 
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {message}
            </motion.p>
            <motion.div 
              className="h-1 w-32 bg-gradient-to-r from-blue-500 to-violet-500 mt-3 rounded-full overflow-hidden mx-auto"
              initial={{ width: 0 }}
              animate={{ width: 128 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <motion.div 
                className="h-full w-full bg-white/30"
                animate={{ x: ["0%", "200%"] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: "linear",
                  repeatType: "loop" 
                }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// For table loading states
export function TableLoadingIndicator() {
  return (
    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center rounded-lg z-20">
      <div className="bg-slate-800/80 px-6 py-4 rounded-xl backdrop-blur-sm shadow-xl flex items-center space-x-3 border border-indigo-500/30">
        <LoadingSpinner variant="dots" color="indigo-400" />
        <span className="text-indigo-200 font-medium">Processing...</span>
      </div>
    </div>
  );
} 
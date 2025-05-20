'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  height?: string | number;
  width?: string | number;
  rounded?: string;
  animate?: boolean;
}

export function Skeleton({
  className = '',
  height = '1rem',
  width = '100%',
  rounded = '0.25rem',
  animate = true
}: SkeletonProps) {
  return (
    <motion.div
      className={`bg-gray-200 ${className}`}
      style={{
        height,
        width,
        borderRadius: rounded
      }}
      animate={animate ? {
        opacity: [0.5, 0.8, 0.5]
      } : undefined}
      transition={animate ? {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      } : undefined}
    />
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  className = ''
}: TableSkeletonProps) {
  return (
    <div className={`w-full ${className}`}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <motion.div 
          key={`skeleton-row-${rowIndex}`}
          className="flex items-center mb-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.3,
            delay: rowIndex * 0.08
          }}
        >
          {/* Icon placeholder */}
          <Skeleton 
            width="24px" 
            height="24px" 
            rounded="50%" 
            className="flex-shrink-0"
          />
          
          {/* First column (wider) */}
          <Skeleton 
            width="180px" 
            height="24px" 
            className="flex-shrink-0"
          />
          
          {/* Additional columns */}
          {Array.from({ length: columns - 1 }).map((_, colIndex) => (
            <Skeleton 
              key={`skeleton-row-${rowIndex}-col-${colIndex}`} 
              width={`${Math.max(50, Math.floor(Math.random() * 120))}px`}
              height="24px"
              className="flex-shrink-0"
            />
          ))}
          
          {/* Action buttons */}
          <div className="flex ml-auto gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton 
                key={`action-${i}`}
                width="24px" 
                height="24px" 
                rounded="4px" 
                className="flex-shrink-0"
              />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
} 
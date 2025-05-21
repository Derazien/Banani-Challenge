'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './styles.module.css';

interface TableErrorContentProps {
  error: string;
}

/**
 * @component
 * @param {TableErrorContentProps} props - Component properties
 * Error state for the table component
 */
export function TableErrorContent({ error }: TableErrorContentProps) {
  return (
    <div className={styles.errorContainer}>
      <motion.div 
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className={styles.errorContent}
      >
        <div className={styles.errorIcon}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <p className={styles.errorMessage}>Error loading table: {error}</p>
      </motion.div>
    </div>
  );
} 
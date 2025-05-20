'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedTableRowProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  id?: string;
}

export function AnimatedTableRow({
  children,
  delay = 0,
  className = '',
  id
}: AnimatedTableRowProps) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: delay * 0.1,
        ease: [0.25, 0.1, 0.25, 1.0] // Custom easing
      }}
      className={className}
      data-row-id={id}
      whileHover={{ 
        backgroundColor: 'rgba(244, 247, 250, 0.5)',
        transition: { duration: 0.2 }
      }}
    >
      {children}
    </motion.tr>
  );
} 
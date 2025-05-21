'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TooltipInfo } from '@/hooks/use-tooltips';
import styles from './styles.module.css';

interface TableTooltipProps {
  tooltip: TooltipInfo;
}

/**
 * @component
 * @param {TableTooltipProps} props - Component properties
 * Tooltip component for table actions
 */
export function TableTooltip({ tooltip }: TableTooltipProps) {
  return (
    <motion.div
      className={styles.tooltip}
      style={{
        left: `${tooltip.x}px`,
        top: `${tooltip.y}px`,
        position: 'fixed',
        transform: 'translate(-50%, -100%)'
      }}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {tooltip.text}
    </motion.div>
  );
} 
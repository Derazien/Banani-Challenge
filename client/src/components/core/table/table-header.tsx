'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Download, Trash, Minimize2, Expand } from 'lucide-react';
import styles from './styles.module.css';

interface TableHeaderProps {
  title: React.ReactNode;
  isLoading: boolean;
  isCollapsed: boolean;
  isCreateNew: boolean;
  onExport: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onToggleCollapse: (e?: React.MouseEvent) => void;
  collapsible: boolean;
}

/**
 * @component
 * @param {TableHeaderProps} props - Component properties
 * Header component for the table
 */
export function TableHeader({
  title,
  isLoading,
  isCollapsed,
  isCreateNew,
  onExport,
  onDelete,
  onToggleCollapse,
  collapsible
}: TableHeaderProps) {
  return (
    <div className={`${styles.tableHeaderOverlay} ${isLoading ? styles.loadingTableHeader : ''}`}>
      <motion.div 
        className={styles.tableTitle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className={styles.tableTitleContent}>
          {title}
          {isLoading && <span className={styles.miniLoadingSpinner} />}
        </div>
        <div className={styles.tableControls}>
          {!isCollapsed && (
            <>
              {!isCreateNew && (
                <motion.button
                  onClick={onExport}
                  className={styles.tableExportButton}
                  aria-label="Export table to XLSX"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Download size={16} />
                </motion.button>
              )}
              {!isCreateNew && (
                <motion.button
                  onClick={onDelete}
                  className={styles.tableDeleteButton}
                  aria-label="Delete table"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Trash size={16} />
                </motion.button>
              )}
            </>
          )}
          {collapsible && !isCreateNew && (
            <motion.button
              onClick={onToggleCollapse}
              className={styles.tableCollapseButton}
              aria-label={isCollapsed ? "Expand table" : "Collapse table"}
              whileTap={{ scale: 0.9 }}
            >
              {isCollapsed ? <Expand size={18} /> : <Minimize2 size={18} />}
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
} 
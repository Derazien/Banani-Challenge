'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getIcon } from '@/components/icon-registry';
import { TableData, TableAction, TableRow } from '@/types/table';
import { AnimatedTableRow } from '@/components/ui/animated-table-row';
import styles from './styles.module.css';

interface TableContentProps {
  tableData: TableData;
  animationParentRef: React.RefObject<HTMLTableSectionElement | null>;
  handleAction: (actionType: string, row: TableRow) => void;
  mounted: boolean;
  actionMessages: Record<string, string>;
  showTooltip: (e: React.MouseEvent<HTMLButtonElement>, action: TableAction) => void;
  hideTooltip: () => void;
  actionLoading: Record<string, boolean>;
  getActionIcon: (action: TableAction, itemId: string) => React.ReactNode;
}

/**
 * @component
 * @param {TableContentProps} props - Component properties
 * Main content component for the table with data
 */
export function TableContent({
  tableData,
  animationParentRef,
  handleAction,
  mounted,
  actionMessages,
  showTooltip,
  hideTooltip,
  actionLoading,
  getActionIcon
}: TableContentProps) {
  return (
    <table className={styles.table}>
      <tbody ref={animationParentRef}>
        <AnimatePresence key={tableData.rows.length}>
          {tableData.rows.map((row, index) => (
            <AnimatedTableRow key={row.id} id={row.id} delay={index} className={styles.tableRow}>
              <td className={`${styles.tableCell} ${styles.firstTableCell}`} data-column-key={tableData.columns[0].key}>
                <div className={styles.tableCellWithIcon}>
                  <span className={styles.tableIcon}>{getIcon(row.icon)}</span>
                  <span className={styles.tableCellContent}>{row[tableData.columns[0].key]}</span>
                </div>
              </td>
              {tableData.columns.slice(1).map((column) => (
                <td key={`${row.id}-${column.key}`} className={styles.tableCell} data-column-key={column.key}>
                  <div className={styles.tableCellContent}>{row[column.key]}</div>
                </td>
              ))}
              <td className={`${styles.tableCell} ${styles.tableCellActions}`}>
                <div className={styles.tableActions}>
                  {tableData.actions.map(action => (
                    <motion.button 
                      key={action.type} 
                      className={styles.tableActionButton}
                      aria-label={action.label}
                      onMouseEnter={(e) => showTooltip(e, action)}
                      onMouseLeave={hideTooltip}
                      onClick={() => {
                        // Ensure the row has table identification data
                        const rowWithTableInfo = { 
                          ...row, 
                          tableKey: tableData.key
                        };
                        handleAction(action.type, rowWithTableInfo);
                      }}
                      disabled={actionLoading[`${row.id}-${action.type}`]}
                      data-action-type={action.type}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      {getActionIcon(action, row.id)}
                    </motion.button>
                  ))}
                </div>
                <AnimatePresence>
                  {mounted && actionMessages[row.id] && (
                    <motion.div
                      className={styles.actionMessage}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {actionMessages[row.id]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </td>
            </AnimatedTableRow>
          ))}
        </AnimatePresence>
      </tbody>
    </table>
  );
} 
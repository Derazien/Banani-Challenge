'use client';

import React from 'react';
import { getIcon } from '@/components/icon-registry';
import styles from './styles.module.css';

/**
 * @component
 * @param {object} props - Component properties (none required)
 * Empty state when creating a new table
 */
export function CreateNewTableContent() {
  return (
    <table className={styles.table}>
      <tbody>
        <tr className={`${styles.tableRow} ${styles.createNewTableRow}`}> 
          <td className={`${styles.tableCell} ${styles.firstTableCell}`}>
            <div className={styles.tableCellWithIcon}>
              <span className={styles.tableIcon}>{getIcon('analytics')}</span>
              <span>Title</span>
            </div>
          </td>
          <td className={styles.tableCell}>Cell</td>
          <td className={styles.tableCell}>Cell</td>
          <td className={`${styles.tableCell} ${styles.tableCellActions}`}>
            <div className={styles.tableActions}>
              <span className={styles.tableActionIcon}>{getIcon('inbox')}</span>
              <span className={styles.tableActionIcon}>{getIcon('delete')}</span>
              <span className={styles.tableActionIcon}>{getIcon('menu')}</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
} 
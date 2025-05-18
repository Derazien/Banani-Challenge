'use client';

import React, { useState, useEffect } from 'react';
import { getIcon } from '@/components/icon-registry';
import styles from './table.module.css';
import { TableData } from '@/types/table';
import { ActionRegistry } from '@/lib/actions/registry';
import { ActionContext } from '@/lib/actions/types';
import { SaveHandler } from '@/lib/actions/handlers/save-handler';

interface TableProps {
  tableData: TableData | null;
  loading: boolean;
  error: string | null;
  title?: React.ReactNode;
  actionContext?: ActionContext;
  onDataUpdate?: (newData: TableData) => void;
}

export function Table({ 
  tableData: initialTableData, 
  loading, 
  error, 
  title, 
  actionContext,
  onDataUpdate 
}: TableProps) {
  const [tableData, setTableData] = useState<TableData | null>(initialTableData);
  const [actionMessages, setActionMessages] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [savedItems, setSavedItems] = useState<Record<string, boolean>>({});
  const actionRegistry = ActionRegistry.getInstance();
  
  // Update local tableData when initialTableData changes
  useEffect(() => {
    setTableData(initialTableData);
  }, [initialTableData]);
  
  // Initialize the registry with needed handlers and load saved items
  useEffect(() => {
    const registry = ActionRegistry.getInstance();
    
    // Load existing saved state if a SaveHandler is registered
    const saveHandler = registry.getHandler('save') as SaveHandler | undefined;
    if (saveHandler) {
      try {
        const items = saveHandler.getSavedItems();
        const savedState: Record<string, boolean> = {};
        
        items.forEach(item => {
          if (item && item.id) {
            savedState[item.id] = true;
          }
        });
        
        setSavedItems(savedState);
      } catch (error) {
        console.error('Error loading saved items:', error);
      }
    }
  }, []);

  if (loading) return <TableLoading title={title} />;
  if (error) return <TableError error={error} title={title} />;
  if (!tableData?.rows?.length) return <TableEmptyState title={title} />;

  // Handle item update (for edit handler)
  const handleItemUpdate = (updatedItem: any) => {
    if (!tableData || !updatedItem || !updatedItem.id) return;
    
    // Create a new copy of the rows with the updated item
    const updatedRows = tableData.rows.map(row => 
      row.id === updatedItem.id ? {...row, ...updatedItem} : row
    );
    
    const updatedTableData = {
      ...tableData,
      rows: updatedRows
    };
    
    // Update local state
    setTableData(updatedTableData);
    
    // Call parent callback if provided
    if (onDataUpdate) {
      onDataUpdate(updatedTableData);
    }
  };
  
  // Handle item removal (for delete handler)
  const handleItemRemove = (itemId: string) => {
    if (!tableData || !itemId) return;
    
    // Create a new copy of the rows without the deleted item
    const filteredRows = tableData.rows.filter(row => row.id !== itemId);
    
    const updatedTableData = {
      ...tableData,
      rows: filteredRows
    };
    
    // Update local state
    setTableData(updatedTableData);
    
    // Call parent callback if provided
    if (onDataUpdate) {
      onDataUpdate(updatedTableData);
    }
  };

  // Handle action button click
  const handleAction = async (actionType: string, rowData: any) => {
    if (actionLoading[`${rowData.id}-${actionType}`]) {
      return; // Prevent multiple clicks while action is processing
    }
    
    // Set loading state for this action
    setActionLoading(prev => ({
      ...prev,
      [`${rowData.id}-${actionType}`]: true
    }));
    
    try {
      // Execute the action using our registry with enhanced context
      const result = await actionRegistry.executeAction(actionType, rowData, {
        ...actionContext,
        tableTitle: tableData?.title,
        tableData,
        updateData: handleItemUpdate,
        removeItem: handleItemRemove
      });
      
      // Store message for this row if provided
      if (result.message) {
        setActionMessages(prev => ({
          ...prev,
          [rowData.id]: result.message
        }));
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setActionMessages(prev => {
            const newState = { ...prev };
            delete newState[rowData.id];
            return newState;
          });
        }, 3000);
      }
      
      // If this is a save action, update the saved state
      if (actionType === 'save' && result.success) {
        setSavedItems(prev => {
          const newState = { ...prev };
          if (result.data?.isSaved) {
            newState[rowData.id] = true;
          } else {
            delete newState[rowData.id];
          }
          return newState;
        });
      }
      
      // If action was not successful, you might want to show an error toast or modal
      if (!result.success && !result.data?.cancelled) {
        console.error(`Action ${actionType} failed:`, result.message);
      }
      
      return result;
    } catch (error) {
      console.error(`Error executing action ${actionType}:`, error);
      
      // Show error message
      setActionMessages(prev => ({
        ...prev,
        [rowData.id]: `Error: ${error instanceof Error ? error.message : 'Action failed'}`
      }));
      
      setTimeout(() => {
        setActionMessages(prev => {
          const newState = { ...prev };
          delete newState[rowData.id];
          return newState;
        });
      }, 3000);
      
      return { success: false, message: 'Action failed due to an error' };
    } finally {
      // Clear loading state
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[`${rowData.id}-${actionType}`];
        return newState;
      });
    }
  };

  // Get the icon to use for an action based on its current state
  const getActionIcon = (action: { type: string; icon?: string }, rowId: string) => {
    // Show loading indicator if the action is in progress
    if (actionLoading[`${rowId}-${action.type}`]) {
      return getIcon('hourglass');
    }
    
    // Special case for save - show filled/unfilled bookmark based on saved state
    if (action.type === 'save') {
      const isSaved = savedItems[rowId];
      return getIcon(isSaved ? 'bookmarkFilled' : 'bookmark');
    }
    
    // For other actions, use the specified icon or the action type as fallback
    return getIcon(action.icon || action.type);
  };

  return (
    <div className={styles.tableWrapper}>
      <div className={styles.tableTitle}>{title}</div>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <tbody>
            {tableData.rows.map((row) => (
              <tr key={row.id} className={styles.tableRow} data-row-id={row.id}>
                <td className={`${styles.tableCell} ${styles.firstTableCell}`} data-column-key={tableData.columns[0].key}>
                  <div className={styles.tableCellWithIcon}>
                    <span className={styles.tableIcon}>
                      {getIcon(row.icon || 'analytics')}
                    </span>
                    <span>{row[tableData.columns[0].key]}</span>
                  </div>
                </td>
                {tableData.columns.slice(1).map((column) => (
                  <td key={`${row.id}-${column.key}`} className={styles.tableCell} data-column-key={column.key}>
                    {row[column.key]}
                  </td>
                ))}
                <td className={`${styles.tableCell} ${styles.tableCellActions}`}>
                  <div className={styles.tableActions}>
                    {tableData.actions.map(action => (
                      <button 
                        key={action.type} 
                        className={styles.tableActionButton}
                        aria-label={action.label}
                        title={action.label}
                        onClick={() => handleAction(action.type, row)}
                        disabled={actionLoading[`${row.id}-${action.type}`]}
                        data-action-type={action.type}
                      >
                        <span className={styles.tableActionIcon}>
                          {getActionIcon(action, row.id)}
                        </span>
                      </button>
                    ))}
                  </div>
                  {actionMessages[row.id] && (
                    <div className={styles.actionMessage}>
                      {actionMessages[row.id]}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TableLoading({ title }: { title?: React.ReactNode }) {
  return (
    <div className={styles.tableWrapper}>
      <div className={styles.tableTitle}>{title}</div>
      <div className={styles.tableContainer}>
        <div className={styles.tableLoading}>
          Loading...
        </div>
      </div>
    </div>
  );
}

function TableError({ error, title }: { error: string; title?: React.ReactNode }) {
  return (
    <div className={styles.tableWrapper}>
      <div className={styles.tableTitle}>{title}</div>
      <div className={styles.tableContainer}>
        <div className={styles.tableError}>
          <p>Error loading table: {error}</p>
        </div>
      </div>
    </div>
  );
}

function TableEmptyState({ title }: { title?: React.ReactNode }) {
  return (
    <div className={styles.tableWrapper}>
      <div className={styles.tableTitle}>{title}</div>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <tbody>
            <tr className={`${styles.tableRow} ${styles.tableEmptyRow}`}>
              <td className={`${styles.tableCell} ${styles.firstTableCell}`}>
                <div className={styles.tableCellWithIcon}>
                  <span className={styles.tableIcon}>
                    {getIcon('analytics')}
                  </span>
                  <span>Title</span>
                </div>
              </td>
              <td className={styles.tableCell}>Cell</td>
              <td className={styles.tableCell}>Cell</td>
              <td className={`${styles.tableCell} ${styles.tableCellActions}`}>
                <div className={styles.tableActions}>
                  <span className={styles.tableActionIcon}>
                    {getIcon('inbox')}
                  </span>
                  <span className={styles.tableActionIcon}>
                    {getIcon('delete')}
                  </span>
                  <span className={styles.tableActionIcon}>
                    {getIcon('menu')}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
} 
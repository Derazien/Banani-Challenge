'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getIcon } from '@/components/icon-registry';
import styles from './table.module.css';
import { TableData } from '@/types/table';
import { ActionRegistry } from '@/lib/actions/registry';
import { ActionContext } from '@/lib/actions/types';
import { SaveHandler } from '@/lib/actions/handlers/save-handler';
import { ExportHandler } from '@/lib/actions/handlers/export-handler';
import { AnimatedTableRow } from '@/components/ui/animated-table-row';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Expand, Minimize2, Download, Trash } from 'lucide-react';
import { TableStorageManager } from '@/lib/storage/table-storage-manager';
import { exportTableToXLSX } from '@/lib/utils/xlsx-export';
import AtomicSpinner from 'atomic-spinner';

interface TableProps {
  tableData: TableData | null;
  loading: boolean;
  error: string | null;
  title?: React.ReactNode;
  actionContext?: ActionContext;
  onDataUpdate?: (newData: TableData) => void;
  collapsible?: boolean;
  zIndex?: number;
  isInitiallyCollapsed?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
  singleTableMode?: boolean;
  fixedWidth?: number;
  isActive?: boolean;
  onDelete?: () => void;
  isCreateNew?: boolean;
  onClick?: () => void;
}

export function Table({ 
  tableData: initialTableData, 
  loading: propsLoading, 
  error: propsError, 
  title: propsTitle, 
  actionContext,
  onDataUpdate,
  collapsible = true,
  zIndex = 900,
  isInitiallyCollapsed = false,
  onExpand,
  onCollapse,
  singleTableMode,
  fixedWidth,
  isActive = false,
  onDelete,
  isCreateNew = false,
  onClick
}: TableProps) {
  // State initialization
  const [isCollapsed, setIsCollapsed] = useState(isInitiallyCollapsed);
  const [savedItems, setSavedItems] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [actionMessages, setActionMessages] = useState<Record<string, string>>({});
  const [activeTooltip, setActiveTooltip] = useState<{ id: string, text: string, x: number, y: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Hooks
  const [animationParent] = useAutoAnimate();
  const actionRegistry = ActionRegistry.getInstance();
  
  // Track mounting for client-side only effects
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Simple toggle function with callbacks
  const toggleCollapse = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    
    // Call the appropriate callback
    if (newCollapsedState && onCollapse) {
      onCollapse();
    } else if (!newCollapsedState && onExpand) {
      onExpand();
    }
  };

  // Title display handling
  const resolvedTitle = propsTitle || initialTableData?.title || 'Table';
  
  // Load saved items on component mount
  useEffect(() => {
    const registry = ActionRegistry.getInstance();
    const saveHandler = registry.getHandler('save') as SaveHandler | undefined;
    if (saveHandler) {
      try {
        // Safely check if the method exists before calling it
        if (typeof saveHandler.getSavedItems === 'function') {
          const items = saveHandler.getSavedItems();
          const savedState: Record<string, boolean> = {};
          items.forEach(item => {
            if (item && item.id) savedState[item.id] = true;
          });
          setSavedItems(savedState);
        } else {
          // Fallback - initialize with empty state
          setSavedItems({});
        }
      } catch (error) {
        console.error('Error loading saved items:', error);
        setSavedItems({});
      }
    }
  }, []);

  const handleItemUpdate = (updatedItem: any) => {
    if (!initialTableData || !updatedItem || !updatedItem.id) return;
    
    // Instead of updating local state, notify the parent component
    if (onDataUpdate) {
      // Create new rows array with the updated item
      const updatedRows = initialTableData.rows.map(row => 
        row.id === updatedItem.id ? {...row, ...updatedItem} : row
      );
      
      // Create a new table data object
      const updatedTableData = { 
        ...initialTableData, 
        rows: updatedRows 
      };
      
      // Notify parent
      onDataUpdate(updatedTableData);
    }
  };
  
  const handleItemRemove = (itemId: string) => {
    if (!initialTableData || !itemId) return;
    
    // Instead of updating local state, notify the parent component
    if (onDataUpdate) {
      // Filter out the removed item
      const filteredRows = initialTableData.rows.filter(row => row.id !== itemId);
      
      // Create a new table data object
      const updatedTableData = { 
        ...initialTableData, 
        rows: filteredRows 
      };
      
      // Notify parent
      onDataUpdate(updatedTableData);
    }
  };

  const handleAction = async (actionType: string, item: any) => {
    // Focus on core actions
    if (!['edit', 'view', 'delete'].includes(actionType)) {
      console.warn(`Action ${actionType} not prioritized in this version. Using only edit, view, and delete.`);
    }
    
    const handler = actionRegistry.getHandler(actionType);
    if (!handler) {
      console.error(`No handler registered for action type: ${actionType}`);
      
      // Display an error message directly
      setActionMessages(prev => ({ 
        ...prev, 
        [item.id]: `Error: Action ${actionType} not available` 
      }));
      setTimeout(() => setActionMessages(prev => { 
        const newState = {...prev}; 
        delete newState[item.id]; 
        return newState; 
      }), 3000);
      
      return;
    }
    
    // Set action as loading
    setActionLoading(prev => ({ ...prev, [`${item.id}-${actionType}`]: true }));
    
    try {
      // Create a context with row-specific handlers
      const rowContext = {
        ...actionContext,
        // These functions let the handlers update/remove rows
        updateData: (updatedData: any) => handleItemUpdate(updatedData),
        removeItem: (itemId: string) => handleItemRemove(itemId)
      };
      
      // Execute the handler
      const result = await handler.execute(item, rowContext);
      
      if (result.success) {
        // Handle specific action success cases
        switch(actionType) {
          case 'delete':
            // Row is already removed by the handler via removeItem callback
            break;
            
          case 'edit':
            // Row is already updated by the handler via updateData callback
            if (result.message) {
              setActionMessages(prev => ({ ...prev, [item.id]: result.message! }));
              setTimeout(() => setActionMessages(prev => { 
                const newState = {...prev}; 
                delete newState[item.id]; 
                return newState; 
              }), 3000);
            }
            break;
            
          case 'view':
            // Just show success message
            if (result.message) {
              setActionMessages(prev => ({ ...prev, [item.id]: result.message! }));
              setTimeout(() => setActionMessages(prev => { 
                const newState = {...prev}; 
                delete newState[item.id]; 
                return newState; 
              }), 3000);
            }
            break;
            
          case 'save':
            // Toggle saved state
            setSavedItems(prev => ({ ...prev, [item.id]: !prev[item.id] }));
            break;
            
          default:
            // Generic handling for other actions
            if (result.data) handleItemUpdate(result.data);
            if (result.message) {
              setActionMessages(prev => ({ ...prev, [item.id]: result.message! }));
              setTimeout(() => setActionMessages(prev => { 
                const newState = {...prev}; 
                delete newState[item.id]; 
                return newState; 
              }), 3000);
            }
        }
      } else {
        // Handle failure
        const errorMessage = result.error || "Action failed";
        setActionMessages(prev => ({ ...prev, [item.id]: `Error: ${errorMessage}` }));
        setTimeout(() => setActionMessages(prev => { 
          const newState = {...prev}; 
          delete newState[item.id]; 
          return newState; 
        }), 3000);
        console.error(`Action ${actionType} failed:`, errorMessage);
      }
    } catch (error) {
      // Handle exceptions
      console.error(`Error executing action ${actionType}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setActionMessages(prev => ({ ...prev, [item.id]: `Error: ${errorMessage}` }));
      setTimeout(() => setActionMessages(prev => { 
        const newState = {...prev}; 
        delete newState[item.id]; 
        return newState; 
      }), 3000);
    } finally {
      // Always clear the loading state
      setActionLoading(prev => { 
        const newState = {...prev}; 
        delete newState[`${item.id}-${actionType}`]; 
        return newState; 
      });
    }
  };
  
  const showTooltip = (e: React.MouseEvent<HTMLButtonElement>, action: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveTooltip({ id: `tooltip-${action.type}`, text: action.label, x: rect.left + rect.width / 2, y: rect.top });
  };
  
  const hideTooltip = () => setActiveTooltip(null);
  
  const getActionIcon = (action: any, itemId: string) => {
    // Show loading spinner if this action is loading for this item
    if (actionLoading[`${itemId}-${action.type}`]) {
      return getIcon('loading');
    }
    
    // Special case for save action (toggle between filled and outline)
    if (action.type === 'save') {
      return savedItems[itemId] ? getIcon('bookmark-filled') : getIcon('bookmark');
    }
    
    // For all other actions, use the icon registry with action type as fallback
    return getIcon(action.icon || action.type);
  };

  // Define motion variants with consistent types
  const tableVariants = {
    collapsed: {
      width: '200px',
      height: '40px',
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    expanded: {
      width: '100%', 
      height: 'auto',
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    }
  };

  const contentVariants = {
    expanded: { 
      opacity: 1, 
      height: 'auto',
      transition: { opacity: { duration: 0.2 }, height: { type: 'spring', stiffness: 300, damping: 30 } } 
    },
    collapsed: { 
      opacity: 0, 
      height: 0,
      transition: { opacity: { duration: 0.15 }, height: { type: 'spring', stiffness: 300, damping: 30 } } 
    },
  };

  const collapsedIconVariants = {
    initial: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1, transition: { delay: 0.1 } },
    exit: { opacity: 0, scale: 0.5, transition: { duration: 0.1 } },
  };

  // Calculate table width based on single table mode
  const getTableWidth = () => {
    if (isCollapsed) return '200px';
    return singleTableMode && fixedWidth ? `${fixedWidth}px` : '50%';
  };

  // Content rendering logic
  let content;
  if (propsLoading) {
    content = <TableLoadingContent />;
  } else if (propsError) {
    content = <TableErrorContent error={propsError} />;
  } else if (!initialTableData?.rows?.length) {
    content = <CreateNewTableContent />;
  } else {
    content = (
      <table className={styles.table}>
        <tbody ref={animationParent}>
          <AnimatePresence key={initialTableData.rows.length}>
            {initialTableData.rows.map((row, index) => (
              <AnimatedTableRow key={row.id} id={row.id} delay={index} className={styles.tableRow}>
                <td className={`${styles.tableCell} ${styles.firstTableCell}`} data-column-key={initialTableData.columns[0].key}>
                  <div className={styles.tableCellWithIcon}>
                    <span className={styles.tableIcon}>{getIcon(row.icon)}</span>
                    <span className={styles.tableCellContent}>{row[initialTableData.columns[0].key]}</span>
                  </div>
                </td>
                {initialTableData.columns.slice(1).map((column) => (
                  <td key={`${row.id}-${column.key}`} className={styles.tableCell} data-column-key={column.key}>
                    <div className={styles.tableCellContent}>{row[column.key]}</div>
                  </td>
                ))}
                <td className={`${styles.tableCell} ${styles.tableCellActions}`}>
                  <div className={styles.tableActions}>
                    {initialTableData.actions.map(action => (
                      <motion.button 
                        key={action.type} 
                        className={styles.tableActionButton}
                        aria-label={action.label}
                        onMouseEnter={(e) => showTooltip(e, action)}
                        onMouseLeave={hideTooltip}
                        onClick={() => handleAction(action.type, row)}
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

  // Modified tooltip element to prevent hydration mismatch
  const tooltipElement = mounted && activeTooltip ? (
    <motion.div
      className={styles.tooltip}
      style={{
        left: `${activeTooltip.x}px`,
        top: `${activeTooltip.y}px`,
        position: 'fixed',
        transform: 'translate(-50%, -100%)'
      }}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {activeTooltip.text}
    </motion.div>
  ) : null;

  // Handle export to XLSX
  const handleExportTable = () => {
    if (!initialTableData) return;
    
    try {
      exportTableToXLSX(initialTableData);
    } catch (error) {
      console.error('Error exporting table:', error);
    }
  };

  // Handle table deletion
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  // Only render once mounted to avoid SSR issues
  if (!mounted) {
    // For SSR, just return null to avoid hydration mismatch entirely
    // The client will render the component after hydration is complete
    return null;
  }
  
  // Client-side rendering with full interactivity
  return (
    <motion.div 
      className={`${styles.tableWrapper} ${isCollapsed ? styles.collapsedTableWrapper : styles.expandedTableWrapper} ${isActive ? styles.activeTable : ''} ${isCreateNew ? styles.createNewTable : ''}`}
      style={{
        position: 'relative',
        cursor: isCollapsed ? 'pointer' : 'default',
        zIndex,
        width: getTableWidth(),
        maxWidth: '100%',
        height: 'auto',
        boxSizing: 'border-box',
        overflow: 'hidden',
        margin: '0 auto'
      }}
      variants={tableVariants}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      initial={isInitiallyCollapsed ? 'collapsed' : 'expanded'}
      onClick={(e) => {
        if (isCollapsed) {
          toggleCollapse(e);
        }
        if (onClick) {
          onClick();
        }
      }}
    >
      <div 
        className={`${styles.tableHeaderOverlay} ${propsLoading ? styles.loadingTableHeader : ''}`}
      >
        <motion.div 
          className={styles.tableTitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className={styles.tableTitleContent}>
            {isCollapsed ? (initialTableData?.title || resolvedTitle || "Table") : resolvedTitle}
            {propsLoading && <span className={styles.miniLoadingSpinner} />}
          </div>
          <div className={styles.tableControls}>
            {!isCollapsed && (
              <>
                {!isCreateNew && (
                  <motion.button
                    onClick={handleExportTable}
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
                    onClick={handleDelete}
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
                onClick={toggleCollapse}
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
      
      <AnimatePresence mode="wait">
        {isCollapsed ? (
          mounted && (
            <motion.div
              key="collapsed-table-title-container"
              variants={collapsedIconVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={styles.collapsedTableContent}
            />
          )
        ) : (
          mounted && (
            <motion.div
              key="expanded-table-content-wrapper"
              variants={contentVariants} 
              initial="collapsed" 
              animate="expanded"
              exit="collapsed"
              className={styles.tableContainer}
              style={{
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                overflow: 'hidden'
              }}
            >
              <div className={styles.tableContentScrollable}>
                {content}
              </div>
              <AnimatePresence>{mounted && tooltipElement}</AnimatePresence>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TableLoadingContent() {
  return (
    <div className={styles.tableLoadingContent} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
      <AtomicSpinner 
        atomSize={220} 
        electronPathCount={4}
        electronsPerPath={6}
        electronPathColor={'rgba(126, 148, 223, 0.4)'} 
        electronColorPalette={['#7e94df', '#a3b3ed', '#c9d2f8']} 
        nucleusParticleFillColor={'#5568b8'} 
        nucleusParticleBorderColor={'#3e4e8c'} 
        nucleusLayerCount={3}
        nucleusParticlesPerLayer={4}
        electronSpeed={0.3}
        nucleusSpeed={0.5}
      />
    </div>
  );
}

function TableErrorContent({ error }: { error: string }) {
  return (
    <div className={styles.tableErrorContent}>
      <motion.div 
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <p>Error loading table: {error}</p>
      </motion.div>
    </div>
  );
}

function CreateNewTableContent() {
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
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getIcon } from '@/components/icon-registry';
import { TableData, TableAction } from '@/types/table';
import { ActionContext } from '@/lib/actions/types';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { exportTableToXLSX } from '@/lib/utils/xlsx-export';
import { useTableActions } from '@/hooks/use-table-actions';
import { useTooltips } from '@/hooks/use-tooltips';

import { TableLoadingContent } from './table-loading';
import { TableErrorContent } from './table-error';
import { CreateNewTableContent } from './create-new-table';
import { TableHeader } from './table-header';
import { TableContent } from './table-content';
import { TableTooltip } from './tooltip';
import styles from './styles.module.css';

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
  onErrorDismiss?: () => void;
}

/**
 * @component
 * @param {TableProps} props - The component props
 * Main Table component with rich interactive features
 */
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
  onClick,
  onErrorDismiss
}: TableProps) {
  // Local state
  const [isCollapsed, setIsCollapsed] = useState(isInitiallyCollapsed);
  const [mounted, setMounted] = useState(false);
  
  // Create a proper ref for the animation parent
  const animationParentRef = useRef<HTMLTableSectionElement>(null);
  const [animationParent] = useAutoAnimate<HTMLElement>();
  
  // Table actions hook
  const { 
    actionLoading, 
    actionMessages, 
    handleAction, 
    getActionIcon: getActionIconHelper 
  } = useTableActions(initialTableData, actionContext, onDataUpdate);
  
  // Tooltips hook
  const { activeTooltip, showTooltip, hideTooltip } = useTooltips();
  
  // Track mounting for client-side only effects
  useEffect(() => {
    setMounted(true);
    
    // Apply the auto-animate ref to our ref object
    if (animationParentRef.current) {
      // Cast to unknown first, then to HTMLElement to safely apply the ref
      animationParent(animationParentRef.current as unknown as HTMLElement);
    }
  }, [animationParent]);
  
  /**
   * @function
   * @param {React.MouseEvent} [e] - The mouse event
   * @returns {void}
   * Toggle collapse state and call appropriate callbacks
   */
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
  
  /**
   * @function
   * @param {React.MouseEvent<HTMLButtonElement>} e - The mouse event
   * @param {TableAction} action - The action object
   * @returns {void}
   * Handle tooltip display
   */
  const handleShowTooltip = (e: React.MouseEvent<HTMLButtonElement>, action: TableAction) => {
    showTooltip(e, action.label, `tooltip-${action.type}`);
  };
  
  /**
   * @function
   * @param {TableAction} action - The action object
   * @param {string} itemId - The item ID
   * @returns {React.ReactNode}
   * Get action icon wrapper
   */
  const getActionIcon = (action: TableAction, itemId: string) => {
    return getActionIconHelper(action, itemId, getIcon);
  };

  // Motion variants
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

  /**
   * @function
   * @returns {string}
   * Calculate table width based on single table mode
   */
  const getTableWidth = () => {
    if (isCollapsed) return '200px';
    return singleTableMode && fixedWidth ? `${fixedWidth}px` : '50%';
  };

  // Determine content based on state
  let content;
  if (propsLoading) {
    content = <TableLoadingContent />;
  } else if (propsError) {
    content = <TableErrorContent error={propsError} onDismiss={onErrorDismiss} />;
  } else if (!initialTableData?.rows?.length) {
    content = <CreateNewTableContent />;
  } else {
    content = (
      <TableContent 
        tableData={initialTableData}
        animationParentRef={animationParentRef}
        handleAction={handleAction}
        mounted={mounted}
        actionMessages={actionMessages}
        showTooltip={handleShowTooltip}
        hideTooltip={hideTooltip}
        actionLoading={actionLoading}
        getActionIcon={getActionIcon}
      />
    );
  }

  /**
   * @function
   * @param {React.MouseEvent} e - The mouse event
   * @returns {void}
   * Handle export to XLSX
   */
  const handleExportTable = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!initialTableData) return;
    
    try {
      exportTableToXLSX(initialTableData);
    } catch (error) {
      console.error('Error exporting table:', error);
    }
  };

  /**
   * @function
   * @param {React.MouseEvent} e - The mouse event
   * @returns {void}
   * Handle table deletion
   */
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  // Only render once mounted to avoid SSR issues
  if (!mounted) {
    return null;
  }
  
  // Client-side rendering with full interactivity
  return (
    <motion.div 
      className={`${styles.tableWrapper} ${styles.gridTableItem} ${isCollapsed ? styles.collapsedTableWrapper : styles.expandedTableWrapper} ${isActive ? styles.activeTable : ''} ${isCreateNew ? styles.createNewTable : ''}`}
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
      <TableHeader 
        title={isCollapsed ? (initialTableData?.title || resolvedTitle || 'Table') : resolvedTitle}
        isLoading={propsLoading}
        isCollapsed={isCollapsed}
        isCreateNew={isCreateNew}
        onExport={handleExportTable}
        onDelete={handleDelete}
        onToggleCollapse={toggleCollapse}
        collapsible={collapsible}
      />
      
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
              <AnimatePresence>
                {mounted && activeTooltip && (
                  <TableTooltip tooltip={activeTooltip} />
                )}
              </AnimatePresence>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </motion.div>
  );
}
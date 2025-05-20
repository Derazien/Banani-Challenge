'use client';

import React, { useEffect, useState } from 'react';
import { TableData } from '@/types/table';
import { Table } from '@/components/core/table';
import { ActionContext } from '@/lib/actions/types';
import styles from './table-grid.module.css';

interface TableGridProps {
  tables: TableData[];
  onTableOrderChange: (tableIds: string[]) => void;
  onTableUpdate: (updatedTable: TableData) => void;
  onTableCollapse: (tableId: string) => void;
  onTableDelete: (tableId: string) => void;
  onTableSelect: (table: TableData) => void;
  activeTableId?: string;
  actionContext?: ActionContext;
  loadingTableId?: string | null;
}

export function TableGrid({ 
  tables, 
  onTableOrderChange, 
  onTableUpdate, 
  onTableCollapse,
  onTableDelete,
  onTableSelect,
  activeTableId,
  actionContext,
  loadingTableId = null
}: TableGridProps) {
  const [mounted, setMounted] = useState(false);
  
  // Memoize the ordered tables array - this must be before other useEffects to maintain hook order
  const orderedTables = React.useMemo(() => {
    if (!mounted) return tables.slice(0, 2);
    
    // Limit to 2 tables maximum for display
    const displayTables = tables.slice(0, 2);
    
    // First, filter out any duplicate "Create New Table" entries
    const uniqueTables = displayTables.filter((table, index, self) => 
      table.key !== 'create_new' || 
      index === self.findIndex(t => t.key === 'create_new')
    );
    
    // Ensure Create New Table is first if present
    const createNewTableIndex = uniqueTables.findIndex(t => t.key === 'create_new');
    
    if (createNewTableIndex > 0) {
      // If Create New Table exists but isn't first, move it to the front
      const createNewTable = uniqueTables.splice(createNewTableIndex, 1)[0];
      uniqueTables.unshift(createNewTable);
    }
    
    return uniqueTables;
  // Remove the JSON.stringify from the dependency array - it causes rerenders
  }, [tables, mounted]);
  
  // This addresses an issue with SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle new tables and maintain order once on component mount
  useEffect(() => {
    if (!mounted) return;
    
    // Get the current table IDs in the correct order
    const tableIdsInOrder = orderedTables.map(t => t.key);
    
    // If order has changed in a meaningful way, update parent
    if (tableIdsInOrder.length > 0 && 
        JSON.stringify(tableIdsInOrder) !== JSON.stringify(tables.slice(0, tableIdsInOrder.length).map(t => t.key))) {
      onTableOrderChange(tableIdsInOrder);
    }
  }, [mounted, orderedTables, onTableOrderChange, tables]);
  
  // Only render once mounted to avoid SSR issues
  if (!mounted) return null;
  
  return (
    <div className={`${styles.verticalTableGrid} ${orderedTables.length === 1 ? styles.singleTableLayout : ''}`}>
      {orderedTables.map((table, index) => (
        <div 
          key={`${table.key}-${table.rows.length}`} 
          className={styles.tableGridItem}
        >
          <Table 
            tableData={table}
            loading={loadingTableId === table.key}
            error={null}
            title={table.title}
            actionContext={actionContext}
            onDataUpdate={onTableUpdate}
            collapsible={true}
            zIndex={activeTableId === table.key ? 900 : 800 - index}
            isInitiallyCollapsed={false}
            onCollapse={() => onTableCollapse(table.key)}
            isGridItem={true}
            singleTableMode={orderedTables.length === 1}
            isActive={activeTableId === table.key}
            onDelete={() => onTableDelete(table.key)}
            onClick={() => onTableSelect(table)}
            isCreateNew={table.key === "create_new"}
          />
        </div>
      ))}
    </div>
  );
} 
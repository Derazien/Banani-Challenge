import { useState, useEffect, useCallback } from 'react';
import { TableData } from '@/types/table';
import { TableStorageManager } from '@/lib/storage/table-storage-manager';
import { CREATE_NEW_TABLE_ID, MAX_EXPANDED_TABLES } from '@/constants/table';

/**
 * Hook for managing table state and operations
 */
export function useTableManagement(createNewTable: TableData) {
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [storedTables, setStoredTables] = useState<TableData[]>([]);
  const [activeTableId, setActiveTableId] = useState<string | null>(CREATE_NEW_TABLE_ID);
  const [expandedTableIds, setExpandedTableIds] = useState<string[]>([CREATE_NEW_TABLE_ID]);
  const [tableLoading, setTableLoading] = useState<string | null>(null);

  // Initialize table state from storage
  useEffect(() => {
    const storageManager = TableStorageManager.getInstance();
    const tables = storageManager.getTables();
    setStoredTables(tables);
    
    const unsubscribe = storageManager.addListener((updatedTables) => {
      setStoredTables(updatedTables);
    });
    
    return () => unsubscribe();
  }, []);

  // Ensure there's always at least one expanded table
  useEffect(() => {
    if (expandedTableIds.length === 0) {
      setExpandedTableIds([CREATE_NEW_TABLE_ID]);
      setActiveTableId(CREATE_NEW_TABLE_ID);
      setTableData(null);
    }
  }, [expandedTableIds]);

  // Auto-expand the active table when it's set
  useEffect(() => {
    if (tableData && tableData.key) {
      if (!expandedTableIds.includes(tableData.key)) {
        setExpandedTableIds(prevIds => {
          if (prevIds.includes(tableData.key)) return prevIds;
          return [...prevIds, tableData.key];
        });
      }
    }
  }, [tableData, expandedTableIds]);

  // Clear all tables from storage
  const clearAllLocalStorage = useCallback(() => {
    const storageManager = TableStorageManager.getInstance();
    storageManager.clearAllTables();
    setStoredTables([]);
    setTableData(null);
    setActiveTableId(CREATE_NEW_TABLE_ID);
    setExpandedTableIds([CREATE_NEW_TABLE_ID]);
  }, []);

  // Handle table update
  const handleTableUpdate = useCallback((updatedTable: TableData) => {
    const storageManager = TableStorageManager.getInstance();
    storageManager.saveTable(updatedTable);
    
    if (activeTableId === updatedTable.key) {
      setTableData(updatedTable);
    }
    
    setStoredTables(storageManager.getTables());
  }, [activeTableId]);

  // Handle table selection
  const handleTableSelect = useCallback((table: TableData) => {
    setActiveTableId(table.key);
    if (table.key !== CREATE_NEW_TABLE_ID) {
      setTableData(table);
    }
  }, []);

  // Handle table expansion
  const handleTableExpand = useCallback((tableId: string) => {
    setActiveTableId(tableId);
    
    if (tableId !== CREATE_NEW_TABLE_ID) {
      const table = storedTables.find(t => t.key === tableId);
      if (table) {
        setTableData(table);
      }
    } else {
      setTableData(null);
    }
    
    setExpandedTableIds(prev => {
      if (prev.includes(tableId)) return prev;
      
      if (tableId === CREATE_NEW_TABLE_ID) {
        return [CREATE_NEW_TABLE_ID];
      }
      
      const hasCreateNew = prev.includes(CREATE_NEW_TABLE_ID);
      
      if (hasCreateNew && prev.length === 1) {
        return [tableId];
      }
      
      // Put newly expanded table at the top of the list
      const newExpandedIds = [tableId, ...prev.filter(id => id !== tableId)];
      
      // Limit to MAX_EXPANDED_TABLES expanded tables
      return newExpandedIds.slice(0, MAX_EXPANDED_TABLES);
    });
  }, [storedTables]);

  // Handle table collapse
  const handleTableCollapse = useCallback((tableId: string) => {
    const wasActive = activeTableId === tableId;
    const remainingExpanded = expandedTableIds.filter(id => id !== tableId);
    
    setExpandedTableIds(prev => {
      const newExpandedIds = prev.filter(id => id !== tableId);
      return newExpandedIds.length === 0 ? [CREATE_NEW_TABLE_ID] : newExpandedIds;
    });
    
    if (wasActive || remainingExpanded.length === 0) {
      if (remainingExpanded.length > 0) {
        // Prioritize real tables over Create New
        const realTables = remainingExpanded.filter(id => id !== CREATE_NEW_TABLE_ID);
        
        if (realTables.length > 0) {
          const newActiveId = realTables[0];
          setActiveTableId(newActiveId);
          
          const table = storedTables.find(t => t.key === newActiveId);
          if (table) setTableData(table);
        } else {
          setActiveTableId(CREATE_NEW_TABLE_ID);
          setTableData(null);
        }
      } else {
        setActiveTableId(CREATE_NEW_TABLE_ID);
        setTableData(null);
        setExpandedTableIds([CREATE_NEW_TABLE_ID]);
      }
    }
  }, [activeTableId, expandedTableIds, storedTables]);

  // Handle table order change
  const handleTableOrderChange = useCallback((newOrder: string[]) => {
    setExpandedTableIds(newOrder);
  }, []);

  return {
    tableData,
    storedTables,
    activeTableId,
    expandedTableIds,
    tableLoading,
    setTableData,
    setActiveTableId,
    setExpandedTableIds,
    setTableLoading,
    setStoredTables,
    clearAllLocalStorage,
    handleTableSelect,
    handleTableExpand,
    handleTableCollapse,
    handleTableUpdate,
    handleTableOrderChange
  };
} 
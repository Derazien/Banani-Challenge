import { useState, useEffect, useCallback } from 'react';
import { TableData } from '@/types/table';
import { TableStorageManager } from '@/lib/storage/table-storage-manager';
import { CREATE_NEW_TABLE_ID, MAX_EXPANDED_TABLES } from '@/constants/table';

/**
 * Hook for managing table state and operations
 */
export function useTableManagement(createNewTable: TableData) {
  // Main state management
  const [storedTables, setStoredTables] = useState<TableData[]>([]);
  const [activeTableData, setActiveTableData] = useState<TableData | null>(null);
  const [expandedTableIds, setExpandedTableIds] = useState<string[]>([CREATE_NEW_TABLE_ID]);
  const [tableLoading, setTableLoading] = useState<string | null>(null);

  // Initialize table state from storage
  useEffect(() => {
    const storageManager = TableStorageManager.getInstance();
    const tables = storageManager.getTables();
    setStoredTables(tables);
    
    const unsubscribe = storageManager.addListener((updatedTables) => {
      setStoredTables(updatedTables);
      
      // Update active table data if the active table was updated
      if (activeTableData) {
        const updatedActiveTable = updatedTables.find(table => table.key === activeTableData.key);
        if (updatedActiveTable) {
          setActiveTableData(updatedActiveTable);
        }
      }
    });
    
    return () => unsubscribe();
  }, [activeTableData]);

  // Ensure there's always at least one expanded table
  useEffect(() => {
    if (expandedTableIds.length === 0) {
      setExpandedTableIds([CREATE_NEW_TABLE_ID]);
      setActiveTableData(null); // Create New table is represented by null
    }
  }, [expandedTableIds]);

  // Auto-expand the active table when it's set
  useEffect(() => {
    if (activeTableData && activeTableData.key) {
      if (!expandedTableIds.includes(activeTableData.key)) {
        setExpandedTableIds(prevIds => {
          if (prevIds.includes(activeTableData.key)) return prevIds;
          return [...prevIds, activeTableData.key];
        });
      }
    }
  }, [activeTableData, expandedTableIds]);

  // Clear all tables from storage
  const clearAllLocalStorage = useCallback(() => {
    const storageManager = TableStorageManager.getInstance();
    storageManager.clearAllTables();
    setStoredTables([]);
    setActiveTableData(null);
    setExpandedTableIds([CREATE_NEW_TABLE_ID]);
  }, []);

  // Handle table update
  const handleTableUpdate = useCallback((updatedTable: TableData) => {
    const storageManager = TableStorageManager.getInstance();
    storageManager.saveTable(updatedTable);
    
    // Update in-memory tables
    const updatedTables = storageManager.getTables();
    setStoredTables(updatedTables);
    
    // If this was the active table, update activeTableData
    if (activeTableData && activeTableData.key === updatedTable.key) {
      setActiveTableData(updatedTable);
    }
  }, [activeTableData]);

  // Handle table selection
  const handleTableSelect = useCallback((table: TableData) => {
    if (table.key !== CREATE_NEW_TABLE_ID) {
      setActiveTableData(table);
    } else {
      setActiveTableData(null);
    }
  }, []);

  // Handle table expansion
  const handleTableExpand = useCallback((tableId: string) => {
    if (tableId !== CREATE_NEW_TABLE_ID) {
      const table = storedTables.find(t => t.key === tableId);
      if (table) {
        setActiveTableData(table);
      }
    } else {
      setActiveTableData(null);
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
    const wasActive = activeTableData && activeTableData.key === tableId;
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
          const newActiveTable = storedTables.find(t => t.key === newActiveId);
          if (newActiveTable) setActiveTableData(newActiveTable);
        } else {
          setActiveTableData(null);
        }
      } else {
        setActiveTableData(null);
        setExpandedTableIds([CREATE_NEW_TABLE_ID]);
      }
    }
  }, [activeTableData, expandedTableIds, storedTables]);

  // Handle table order change
  const handleTableOrderChange = useCallback((newOrder: string[]) => {
    setExpandedTableIds(newOrder);
  }, []);

  // Get the active table ID
  const activeTableId = activeTableData ? activeTableData.key : CREATE_NEW_TABLE_ID;

  return {
    activeTableData,
    storedTables,
    activeTableId,
    expandedTableIds,
    tableLoading,
    setActiveTableData,
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
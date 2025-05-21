"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TableData } from '@/types/table';
import { ActionRegistry } from '@/lib/actions/registry';
import { SaveHandler } from '@/lib/actions/handlers/save-handler';
import { ExportHandler } from '@/lib/actions/handlers/export-handler';
import { PromptBox } from "@/components/core/prompt-box";
import styles from "./page.module.css";
import { DeleteHandler } from '@/lib/actions/handlers/delete-handler';
import { ViewHandler } from '@/lib/actions/handlers/view-handler';
import { EditHandler } from '@/lib/actions/handlers/edit-handler';
import { AppHeader } from '@/components/ui/app-header';
import { TableStorageManager } from '@/lib/storage/table-storage-manager';
import { TableGrid } from '@/components/layout/table-grid';
import { TableTabs } from '@/components/layout/table-tabs';
import { ConfirmDialog } from '@/components/modals';
import { useTableManagement } from '@/hooks/use-table-management';
import { usePromptPosition } from '@/hooks/use-prompt-position';
import { CREATE_NEW_TABLE_ID } from '@/constants/table';

// Create New Table definition - never stored in local storage
const createNewTable: TableData = {
  key: CREATE_NEW_TABLE_ID,
  title: "Create New Table",
  columns: [
    { key: "col0", label: "Title" },
    { key: "col1", label: "Value 1" },
    { key: "col2", label: "Value 2" }
  ],
  rows: [],
  actions: []
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [tableErrors, setTableErrors] = useState<Record<string, string>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<string | null>(null);
  
  const { 
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
  } = useTableManagement(createNewTable);
  
  const { positions, handlePromptBoxPositionChange } = usePromptPosition();

  // Initialize key event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && e.shiftKey) {
        clearAllLocalStorage();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearAllLocalStorage]);
  
  // Register action handlers once on component mount
  useEffect(() => {
    // TODO: Re-enable dynamic action handler fetching when backend is complete
    const registry = ActionRegistry.getInstance();
    registry.registerHandler('save', new SaveHandler());
    registry.registerHandler('delete', new DeleteHandler());
    registry.registerHandler('view', new ViewHandler());
    registry.registerHandler('edit', new EditHandler());
    registry.registerHandler('export', new ExportHandler());
  }, []);

  async function fetchTableData(userPrompt: string) {
    if (!activeTableId) return;
    
    setTableLoading(activeTableId);
    setTableErrors(prev => {
      const newErrors = {...prev};
      delete newErrors[activeTableId];
      return newErrors;
    });
    
    try {
      const isEditMode = activeTableId !== CREATE_NEW_TABLE_ID;
      const requestData = { 
        prompt: userPrompt,
        ...(isEditMode && activeTableData ? { existingTable: activeTableData } : {})
      };
      
      // Using the backend API directly through the Vercel rewrites
      const res = await fetch("/api/table/generate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate"
        },
        cache: 'no-store',
        body: JSON.stringify(requestData),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details ? JSON.stringify(data.details) : data.error || "Failed to fetch table data");
      }
      
      if (!data.columns || !Array.isArray(data.columns) || !data.rows || !Array.isArray(data.rows)) {
        throw new Error(JSON.stringify({
          error: 'Invalid response format',
          details: { message: 'Missing or invalid data structure' }
        }));
      }
      
      const storageManager = TableStorageManager.getInstance();

      if (activeTableId === CREATE_NEW_TABLE_ID) {
        // Create new table flow
        storageManager.saveTable(data);
        setActiveTableData(data);
        setExpandedTableIds((prev: string[]) => {
          const withoutCreateNew = prev.filter((id: string) => id !== CREATE_NEW_TABLE_ID);
          return [data.key, ...withoutCreateNew].slice(0, 2);
        });
      } else {
        // Update existing table flow
        if (activeTableId !== data.key) {
          // Key changed
          storageManager.removeTable(activeTableId);
          setActiveTableData(data);
          setExpandedTableIds((prev: string[]) => 
            prev.map((id: string) => id === activeTableId ? data.key : id)
          );
          storageManager.saveTable(data);
        } else {
          // No key change
          setActiveTableData(data);
          storageManager.saveTable(data);
        }
      }
      
      setStoredTables(storageManager.getTables());
    } catch (err: any) {
      setTableErrors(prev => ({
        ...prev,
        [activeTableId]: err.message || "Unknown error"
      }));
      console.error("Error in table operation:", err);
    } finally {
      setTableLoading(null);
    }
  }

  const handlePromptSubmit = () => {
    if (!prompt.trim() || !activeTableId) return;
    setTableLoading(activeTableId);
    fetchTableData(prompt);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    
    if (!activeTableId) return;
    
    const isEditMode = activeTableId !== CREATE_NEW_TABLE_ID;
    if (!isEditMode) {
      setTableLoading(activeTableId);
      fetchTableData(suggestion);
    }
  };

  const handleDismissError = () => setTableErrors({});
  
  const handleTableDelete = (tableId: string) => {
    setTableToDelete(tableId);
    setDeleteConfirmOpen(true);
  };
  
  const confirmTableDelete = () => {
    if (!tableToDelete) return;
    
    const storageManager = TableStorageManager.getInstance();
    storageManager.removeTable(tableToDelete);
    
    const wasActive = activeTableId === tableToDelete;
    const wasExpanded = expandedTableIds.includes(tableToDelete);
    const otherExpandedTables = expandedTableIds.filter(id => 
      id !== tableToDelete && id !== CREATE_NEW_TABLE_ID
    );
    
    setExpandedTableIds((prev: string[]) => {
      const newExpandedIds = prev.filter((id: string) => id !== tableToDelete);
      return newExpandedIds.length === 0 ? [CREATE_NEW_TABLE_ID] : newExpandedIds;
    });
    
    if (wasActive || (wasExpanded && otherExpandedTables.length === 0)) {
      if (otherExpandedTables.length > 0) {
        const newActiveId = otherExpandedTables[0];
        setActiveTableData(storedTables.find(t => t.key === newActiveId) || null);
      } else {
        setActiveTableData(null);
        
        if (!expandedTableIds.includes(CREATE_NEW_TABLE_ID)) {
          setExpandedTableIds(prev => [CREATE_NEW_TABLE_ID, ...prev.filter(id => id !== CREATE_NEW_TABLE_ID)]);
        }
      }
    }
    
    setDeleteConfirmOpen(false);
    setTableToDelete(null);
  };
  
  const cancelTableDelete = () => {
    setDeleteConfirmOpen(false);
    setTableToDelete(null);
  };

  // Create a more robust actionContext with full tables list
  const actionContext = {
    userId: 'user-123',
    tableId: activeTableId,
    viewId: 'main-view',
    tableTitle: activeTableData?.title,
    allTables: storedTables,
    updateData: (updatedData: any) => {
      if (!activeTableData || !updatedData.id) return;
      
      // Verify we're updating the active table
      if (activeTableId !== activeTableData.key) {
        console.error('Table mismatch: trying to update inactive table');
        return;
      }
      
      const updatedRows = activeTableData.rows.map(row => 
        row.id === updatedData.id ? {...row, ...updatedData} : row
      );
      
      const updatedTable = {
        ...activeTableData,
        rows: updatedRows
      };
      
      setActiveTableData(updatedTable);
      
      const storageManager = TableStorageManager.getInstance();
      storageManager.saveTable(updatedTable);
      storageManager.inspectLocalStorage();
      
      setStoredTables(storageManager.getTables());
    },
    removeItem: (itemId: string, tableId?: string) => {
      // Use provided tableId if available, otherwise use active table
      const targetTableId = tableId || activeTableId;
      
      if (!targetTableId) return;
      
      // Find the table to modify (either active table or specified table)
      const tableToModify = targetTableId === activeTableId 
        ? activeTableData 
        : storedTables.find(table => table.key === targetTableId);
      
      if (!tableToModify) {
        console.error(`Cannot find table with ID ${targetTableId}`);
        return;
      }
      
      if (!itemId) {
        console.error('No item ID provided for removal');
        return;
      }
      
      // Double-check that the item exists in this table
      const itemExists = tableToModify.rows.some(row => row.id === itemId);
      
      if (!itemExists) {
        console.error(`Item with ID ${itemId} not found in table ${targetTableId}`);
        return;
      }
      
      // Create updated table with item removed
      const filteredRows = tableToModify.rows.filter(row => row.id !== itemId);
      
      const updatedTable = {
        ...tableToModify,
        rows: filteredRows
      };
      
      // Single source of truth - update storage first
      const storageManager = TableStorageManager.getInstance();
      
      storageManager.saveTable(updatedTable);
      
      // Get the latest tables from storage
      const updatedTables = storageManager.getTables();
      
      // Update React state with the data from storage
      setStoredTables(updatedTables);
      
      // If this is the active table, update activeTableData
      if (targetTableId === activeTableId) {
        // Find the table in the updated tables array to ensure consistency
        const updatedActiveTable = updatedTables.find(table => table.key === targetTableId);
        if (updatedActiveTable) {
          setActiveTableData(updatedActiveTable);
        }
      }
    }
  };

  // Filter and prepare tables for display
  const expandedStoredTables = storedTables.filter(table => 
    expandedTableIds.includes(table.key)
  );

  const expandedTables = (() => {
    const result = [...expandedStoredTables];
    if (expandedTableIds.includes(CREATE_NEW_TABLE_ID)) {
      result.unshift(createNewTable);
    }
    return result;
  })();

  const collapsedStoredTables = storedTables.filter(table => 
    !expandedTableIds.includes(table.key)
  );

  const collapsedTables = (() => {
    const result = [...collapsedStoredTables];
    if (!expandedTableIds.includes(CREATE_NEW_TABLE_ID)) {
      result.unshift(createNewTable);
    }
    return result;
  })();

  return (
    <main className="relative min-h-screen text-gray-900 dark:text-gray-100">
      <motion.div 
        className={styles.homeContainer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <AppHeader />
        
        <ConfirmDialog 
          isOpen={deleteConfirmOpen}
          title="Delete Table"
          message="Are you sure you want to delete this table? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmTableDelete}
          onClose={cancelTableDelete}
          type="delete"
        />
        
        <PromptBox 
          prompt={prompt}
          setPrompt={setPrompt}
          onSubmit={handlePromptSubmit}
          loading={tableLoading === activeTableId}
          onSuggestionClick={handleSuggestionClick}
          initialPosition={positions.promptBox}
          collapsible={true}
          onPositionChange={handlePromptBoxPositionChange}
          zIndex={3000}
          isEditMode={activeTableId !== null && activeTableId !== CREATE_NEW_TABLE_ID} 
        />
        
        {expandedTables.length > 0 && (
          <TableGrid
            tables={expandedTables}
            onTableOrderChange={handleTableOrderChange}
            onTableUpdate={handleTableUpdate}
            onTableCollapse={handleTableCollapse}
            onTableDelete={handleTableDelete}
            onTableSelect={handleTableSelect}
            activeTableId={activeTableId || undefined}
            actionContext={actionContext}
            loadingTableId={tableLoading}
            tableErrors={tableErrors}
            onErrorDismiss={(tableId) => setTableErrors(prev => {
              const newErrors = {...prev};
              delete newErrors[tableId];
              return newErrors;
            })}
          />
        )}
        
        {collapsedTables.length > 0 && (
          <TableTabs
            tables={collapsedTables}
            onTableExpand={handleTableExpand}
            onTableSelect={handleTableSelect}
            activeTableId={activeTableId || undefined}
            loadingTableId={tableLoading}
            tableErrors={tableErrors}
          />
        )}
      </motion.div>
    </main>
  );
}

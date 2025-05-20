"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Table } from '@/components/core/table';
import { TableData } from '@/types/table';
import { ActionRegistry } from '@/lib/actions/registry';
import { ActionSyncService } from '@/lib/actions/sync-service';
import { SaveHandler } from '@/lib/actions/handlers/save-handler';
import { ExportHandler } from '@/lib/actions/handlers/export-handler';
import { PromptBox } from "@/components/core/prompt-box";
import styles from "./page.module.css";
import { DeleteHandler } from '@/lib/actions/handlers/delete-handler';
import { ViewHandler } from '@/lib/actions/handlers/view-handler';
import { EditHandler } from '@/lib/actions/handlers/edit-handler';
import { AppHeader } from '@/components/ui/app-header';
import { LoadingOverlay } from '@/components/ui/loading-spinner';
import { ErrorAlert } from '@/components/ui/error-alert';
import { TableSkeleton } from '@/components/ui/loading-skeleton';
import { Position } from '@/types/draggable';
import { TableStorageManager } from '@/lib/storage/table-storage-manager';
import { TableGrid } from '@/components/layout/table-grid';
import { TableTabs } from '@/components/layout/table-tabs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

// Calculate proper initial positions for UI elements
function getInitialPositions() {
  // Use sensible default values for server-side rendering
  const defaultPositions = {
    promptBox: { x: 20, y: 80 },
    table: { x: 20, y: 120 }
  };

  // Only access window in browser environment
  if (typeof window === 'undefined') {
    return defaultPositions;
  }

  // Calculate based on actual window size
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  return {
    promptBox: { x: 20, y: 80 },
    table: { 
      x: Math.max(20, (windowWidth / 2) - 300),  // Center horizontally with 300px offset
      y: Math.min(120, windowHeight * 0.15)      // 15% from top, max 120px
    }
  };
}

// Create New Table definition - never stored in local storage
const createNewTable: TableData = {
  key: "create_new",
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
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [storedTables, setStoredTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [positions, setPositions] = useState(getInitialPositions());
  const [activeTableId, setActiveTableId] = useState<string | null>("create_new"); // Default selection is Create New
  
  // Track expanded and collapsed tables
  const [expandedTableIds, setExpandedTableIds] = useState<string[]>(["create_new"]); // Create New is expanded by default
  
  // Add a tableLoading state to track which table is currently loading
  const [tableLoading, setTableLoading] = useState<string | null>(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<string | null>(null);
  
  // Add a function to clear all local storage
  const clearAllLocalStorage = useCallback(() => {
    const storageManager = TableStorageManager.getInstance();
    storageManager.clearAllTables();
    setStoredTables([]);
    setTableData(null);
    setActiveTableId("create_new");
    setExpandedTableIds(["create_new"]);
  }, []);

  // Add a useEffect to clear tables when pressing Shift+Delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && e.shiftKey) {
        clearAllLocalStorage();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearAllLocalStorage]);
  
  // Update tables state from storage
  useEffect(() => {
    const storageManager = TableStorageManager.getInstance();
    
    // Load tables from storage
    const tables = storageManager.getTables();
    
    // Set the stored tables
    setStoredTables(tables);
    
    // Listen for storage changes
    const unsubscribe = storageManager.addListener((updatedTables) => {
      setStoredTables(updatedTables);
    });
    
    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);
  
  // Register action handlers once on component mount
  useEffect(() => {
    const registry = ActionRegistry.getInstance();
    registry.registerHandler('save', new SaveHandler());
    registry.registerHandler('delete', new DeleteHandler());
    registry.registerHandler('view', new ViewHandler());
    registry.registerHandler('edit', new EditHandler());
    registry.registerHandler('export', new ExportHandler());
    
    // TODO: Re-enable dynamic action handler fetching when backend is complete
    // This will enable maximum dynamic handling of different action types
    // const syncService = ActionSyncService.getInstance();
    // syncService.configure({
    //   apiUrl: '/api/action-handlers',
    //   syncIntervalMs: 5 * 60 * 1000
    // });
    // syncService.startSync();
    // 
    // return () => syncService.stopSync();
  }, []);

  // Ensure there's always at least one expanded table
  useEffect(() => {
    if (expandedTableIds.length === 0) {
      // If no tables are expanded, expand Create New Table
      setExpandedTableIds(["create_new"]);
      setActiveTableId("create_new");
      setTableData(null);
    }
  }, [expandedTableIds]);

  // Auto-expand the active table when it's set - with safeguards
  useEffect(() => {
    if (tableData && tableData.key) {
      // Only add to expanded IDs if it's not already there
      if (!expandedTableIds.includes(tableData.key)) {
        setExpandedTableIds(prev => [...prev, tableData.key]);
      }
    }
  }, [tableData, expandedTableIds]);

  // Find the useEffect that updates expandedTables when expandedTableIds change
  useEffect(() => {
    // Only recalculate grid positions when expandedTableIds actually changes
    // and only if expandedTableIds has items in it
    if (expandedTableIds.length > 0) {
      const tables = storedTables.filter(table => expandedTableIds.includes(table.key));
      // Only update if we have tables that match the expanded IDs
      if (tables.length > 0) {
        // Do any necessary updates for expanded tables here
      }
    }
  }, [expandedTableIds, storedTables]);

  async function fetchTableData(userPrompt: string) {
    // If no table is active, do nothing (this shouldn't happen)
    if (!activeTableId) return;
    
    // Set loading state for the active table
    setTableLoading(activeTableId);
    setError(null);
    
    try {
      // Determine if we're editing an existing table or creating a new one
      const isEditMode = activeTableId !== null && activeTableId !== "create_new";
      
      // Prepare request data
      const requestData: any = { prompt: userPrompt };
      
      // If we're in edit mode, include the existing table data
      if (isEditMode && tableData) {
        requestData.existingTable = tableData;
      }
      
      // Log the mode and request
      console.log(`${isEditMode ? 'Editing' : 'Creating'} table with prompt: ${userPrompt}`);
      if (isEditMode) {
        console.log('Using existing table:', tableData?.key);
      }
      
      const res = await fetch("/api/generate-table", {
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
        const errorMessage = data.error || "Failed to fetch table data";
        const errorDetails = data.details ? JSON.stringify(data.details) : null;
        throw new Error(errorDetails || errorMessage);
      }
      
      // Validate response data
      if (!data.columns || !Array.isArray(data.columns)) {
        throw new Error(JSON.stringify({
          error: 'Invalid response format',
          details: { message: 'Missing or invalid columns array' }
        }));
      }
      if (!data.rows || !Array.isArray(data.rows)) {
        throw new Error(JSON.stringify({
          error: 'Invalid response format',
          details: { message: 'Missing or invalid rows array' }
        }));
      }
      
      // The storage manager
      const storageManager = TableStorageManager.getInstance();

      // Handle differently based on whether Create New Table is active
      if (activeTableId === "create_new") {
        // Standard flow - create a new table
        console.log("Creating new table:", data.title);
        
        // Save the new table to storage
        storageManager.saveTable(data);
        
        // Update state in correct order to ensure UI updates properly
        // First update tableData (direct state update)
        setTableData({...data});
        
        // Then update activeTableId
        setActiveTableId(data.key);
        
        // Finally update expandedTableIds
        setExpandedTableIds(prev => {
          // Remove Create New Table from expanded tables
          const withoutCreateNew = prev.filter(id => id !== "create_new");
          
          // Add the new table at the beginning
          return [data.key, ...withoutCreateNew].slice(0, 2);
        });
        
        console.log("New table created and state updated:", data.key);
      } else {
        // Replace the currently active table with the new data
        console.log(`Replacing table ${activeTableId} with new data titled ${data.key}`);
        
        // If the key changed, we need to handle that specially
        if (activeTableId !== data.key) {
          // Remove the old table
          storageManager.removeTable(activeTableId);
          
          // Important: Update state in the correct order to prevent stale references
          
          // First update the table data with the new content
          setTableData({...data}); // Create a new object reference to force re-render
          
          // Then update the active table ID to match the new key
          setActiveTableId(data.key);
          
          // Finally update the expanded tables list with the new key
          setExpandedTableIds(prev => 
            prev.map(id => id === activeTableId ? data.key : id)
          );
          
          // Save the new table
          storageManager.saveTable(data);
        } else {
          // No key change, just update the content
          
          // First, update the table data in state
          setTableData({...data}); // Create a new object reference to force re-render
          
          // Then save to storage
          storageManager.saveTable(data);
        }
        
        console.log("Table updated:", data.key);
      }
      
      // Force a refresh of the stored tables state from storage
      setStoredTables(storageManager.getTables());
      
      console.log(`Table operation completed successfully: ${data.key}`);
    } catch (err: any) {
      setError(err.message || "Unknown error");
      console.error("Error in table operation:", err);
    } finally {
      // Clear loading state
      setTableLoading(null);
    }
  }

  // Handler functions
  const handlePromptSubmit = () => {
    if (!prompt.trim()) return;
    
    // If no table is active, do nothing (this shouldn't happen)
    if (!activeTableId) return;
    
    // Set loading state for the active table
    setTableLoading(activeTableId);
    
    // Log the mode (create or edit)
    const isEditMode = activeTableId !== null && activeTableId !== "create_new";
    console.log(`${isEditMode ? 'Editing' : 'Creating'} table with prompt: ${prompt}`);
    
    // Proceed with fetching table data
    fetchTableData(prompt);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    
    // If no table is active, do nothing (this shouldn't happen)
    if (!activeTableId) return;
    
    // For suggestions, immediately submit unless in edit mode
    // In edit mode, let the user review and possibly modify the suggestion before submitting
    const isEditMode = activeTableId !== null && activeTableId !== "create_new";
    if (!isEditMode) {
      // Set loading state
      setTableLoading(activeTableId);
      
      // Submit the suggestion
      fetchTableData(suggestion);
    }
    // In edit mode, just update the prompt and let the user submit manually
  };

  const handleDismissError = () => {
    setError(null);
  };
  
  const handleTableUpdate = (updatedTable: TableData) => {
    console.log("Table updated:", updatedTable.key);
    
    // Save the updated table to storage
    const storageManager = TableStorageManager.getInstance();
    storageManager.saveTable(updatedTable);
    
    // If this is the currently active table, update our local state
    if (activeTableId === updatedTable.key) {
      setTableData(updatedTable);
    }
    
    // Refresh the list of stored tables
    setStoredTables(storageManager.getTables());
  };
  
  // Modified to show confirmation dialog first
  const handleTableDelete = (tableId: string) => {
    setTableToDelete(tableId);
    setDeleteConfirmOpen(true);
  };
  
  // Actual deletion when confirmed
  const confirmTableDelete = () => {
    if (!tableToDelete) return;
    
    const storageManager = TableStorageManager.getInstance();
    storageManager.removeTable(tableToDelete);
    
    // Check if this was the active table
    const wasActive = activeTableId === tableToDelete;
    
    // Check if this was an expanded table
    const wasExpanded = expandedTableIds.includes(tableToDelete);
    
    // Get the remaining expanded tables (excluding the one being deleted and Create New)
    const otherExpandedTables = expandedTableIds.filter(id => 
      id !== tableToDelete && id !== "create_new"
    );
    
    // Update expanded tables first, removing the deleted table
    setExpandedTableIds(prev => {
      const newExpandedIds = prev.filter(id => id !== tableToDelete);
      
      // If this would result in all tables being collapsed, expand Create New Table
      if (newExpandedIds.length === 0) {
        return ["create_new"];
      }
      
      return newExpandedIds;
    });
    
    // If the deleted table was active or if there are no other expanded tables
    if (wasActive || (wasExpanded && otherExpandedTables.length === 0)) {
      // If there are other tables expanded (not including Create New Table)
      if (otherExpandedTables.length > 0) {
        // Select the first other expanded table
        const newActiveId = otherExpandedTables[0];
        setActiveTableId(newActiveId);
        
        // Update tableData for the selected table
        const table = storedTables.find(t => t.key === newActiveId);
        if (table) {
          setTableData(table);
        }
      } else {
        // No other tables expanded, select Create New Table
        setActiveTableId("create_new");
        setTableData(null);
        
        // Make sure Create New Table is in the expanded list
        if (!expandedTableIds.includes("create_new")) {
          setExpandedTableIds(prev => ["create_new", ...prev.filter(id => id !== "create_new")]);
        }
      }
    }
    
    // Close the confirmation dialog
    setDeleteConfirmOpen(false);
    setTableToDelete(null);
  };
  
  // Cancel delete action
  const cancelTableDelete = () => {
    setDeleteConfirmOpen(false);
    setTableToDelete(null);
  };

  // Handle table selection
  const handleTableSelect = (table: TableData) => {
    setActiveTableId(table.key);
    // Don't set tableData for Create New Table
    if (table.key !== "create_new") {
      setTableData(table);
    }
  };

  // Handle table expansion with careful state updates
  const handleTableExpand = useCallback((tableId: string) => {
    // Always set this table as the active table when expanded
    setActiveTableId(tableId);
    
    // If expanding a stored table (not Create New), update tableData
    if (tableId !== "create_new") {
      const table = storedTables.find(t => t.key === tableId);
      if (table) {
        setTableData(table);
      }
    } else {
      // If expanding Create New Table, clear tableData
      setTableData(null);
    }
    
    setExpandedTableIds(prev => {
      // If it's already expanded, just ensure it's selected but don't change expansion state
      if (prev.includes(tableId)) {
        return prev;
      }
      
      // If expanding Create New Table, only show Create New Table
      if (tableId === "create_new") {
        return ["create_new"];
      }
      
      // If a regular table, check if Create New Table is expanded
      const hasCreateNew = prev.includes("create_new");
      
      // If Create New is expanded, replace it with the new table
      if (hasCreateNew && prev.length === 1) {
        return [tableId];
      }
      
      // Regular case: Put the newly expanded table at the TOP of the list
      const newExpandedIds = [tableId, ...prev.filter(id => id !== tableId)];
      
      // Limit to 2 expanded tables max
      if (newExpandedIds.length > 2) {
        return newExpandedIds.slice(0, 2);
      }
      
      return newExpandedIds;
    });
  }, [storedTables]);
  
  // Handle table collapse with updated selection logic
  const handleTableCollapse = useCallback((tableId: string) => {
    // Check if this was the active table
    const wasActive = activeTableId === tableId;
    
    // Get the remaining expanded tables (excluding the one being collapsed)
    const remainingExpanded = expandedTableIds.filter(id => id !== tableId);
    
    // Remove from expanded tables
    setExpandedTableIds(prev => {
      const newExpandedIds = prev.filter(id => id !== tableId);
      
      // If this would result in all tables being collapsed, expand Create New Table
      if (newExpandedIds.length === 0) {
        // Ensure Create New Table is expanded
        return ["create_new"];
      }
      
      return newExpandedIds;
    });
    
    // If this was the active table or if there would be no tables expanded, we need to select another one
    if (wasActive || remainingExpanded.length === 0) {
      // If there are still some expanded tables
      if (remainingExpanded.length > 0) {
        // Prioritize selecting a real table over Create New Table if possible
        const realTables = remainingExpanded.filter(id => id !== "create_new");
        
        if (realTables.length > 0) {
          // Select the first real table
          const newActiveId = realTables[0];
          setActiveTableId(newActiveId);
          
          // Update tableData for the selected table
          const table = storedTables.find(t => t.key === newActiveId);
          if (table) {
            setTableData(table);
          }
        } else {
          // No real tables, select Create New
          setActiveTableId("create_new");
          setTableData(null);
        }
      } else {
        // No tables left expanded, select and expand Create New Table
        setActiveTableId("create_new");
        setTableData(null);
        setExpandedTableIds(["create_new"]);
      }
    }
  }, [activeTableId, expandedTableIds, storedTables]);
  
  // Handle table order change
  const handleTableOrderChange = useCallback((newOrder: string[]) => {
    // Update the order of expanded tables
    setExpandedTableIds(newOrder);
  }, []);

  const actionContext = {
    userId: 'user-123',
    tableId: 'main-table',
    viewId: 'main-view',
    tableTitle: tableData?.key
  };

  // Filter stored tables for the UI (expanded and collapsed)
  // Get expanded tables from storage (exclude Create New Table)
  const expandedStoredTables = storedTables.filter(table => 
    expandedTableIds.includes(table.key)
  );

  // Create expanded tables array, always putting Create New Table first if it's expanded
  const expandedTables = (() => {
    // Start with expanded stored tables
    const result = [...expandedStoredTables];
    
    // Add Create New Table at the beginning if it's expanded
    if (expandedTableIds.includes("create_new")) {
      result.unshift(createNewTable);
    }
    
    return result;
  })();

  // Get collapsed stored tables (exclude Create New Table)
  const collapsedStoredTables = storedTables.filter(table => 
    !expandedTableIds.includes(table.key)
  );

  // Create collapsed tables array, always putting Create New Table first if it's collapsed
  const collapsedTables = (() => {
    // Start with collapsed stored tables
    const result = [...collapsedStoredTables];
    
    // Add Create New Table at the beginning if it's not expanded
    if (!expandedTableIds.includes("create_new")) {
      result.unshift(createNewTable);
    }
    
    return result;
  })();

  // Create a memoized position change handler to prevent recreation on each render
  const handlePromptBoxPositionChange = useCallback((newPos: Position) => {
    // Only update if the position has actually changed
    setPositions(prev => {
      // Skip update if position is the same
      if (prev.promptBox.x === newPos.x && prev.promptBox.y === newPos.y) {
        return prev;
      }
      return {
        ...prev,
        promptBox: newPos
      };
    });
  }, []);

  // Add a Debug UI for clearing storage in dev mode
  const renderDebugControls = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div className={styles.debugControls}>
        <button 
          onClick={clearAllLocalStorage}
          className={styles.debugButton}
        >
          Clear All Tables
        </button>
        <div className={styles.debugInfo}>
          <div>Active: {activeTableId || 'None'}</div>
          <div>Expanded: {expandedTableIds.join(', ') || 'None'}</div>
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      className={styles.homeContainer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <AppHeader />
      
      {/* Delete confirmation dialog */}
      <ConfirmDialog 
        isOpen={deleteConfirmOpen}
        title="Delete Table"
        message={`Are you sure you want to delete this table? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmTableDelete}
        onClose={cancelTableDelete}
        type="delete"
      />
      
      {renderDebugControls()}
      
            <PromptBox        prompt={prompt}        setPrompt={setPrompt}        onSubmit={handlePromptSubmit}        loading={tableLoading === activeTableId}        onSuggestionClick={handleSuggestionClick}        initialPosition={positions.promptBox}        collapsible={true}        onPositionChange={handlePromptBoxPositionChange}        zIndex={3000}        isEditMode={activeTableId !== null && activeTableId !== "create_new"}      />
      
      <AnimatePresence>
        {error && (
          <motion.div 
            className="w-full mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <ErrorAlert 
              message={error} 
              title="Failed to generate table" 
              onDismiss={handleDismissError}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Render expanded tables in the grid */}
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
        />
      )}
      
      {/* Render collapsed tables as tabs */}
      {collapsedTables.length > 0 && (
        <TableTabs
          tables={collapsedTables}
          onTableExpand={handleTableExpand}
          onTableSelect={handleTableSelect}
          activeTableId={activeTableId || undefined}
          loadingTableId={tableLoading}
        />
      )}
    </motion.div>
  );
}

"use client";

import React, { useEffect, useState } from 'react';
import { Table } from '@/components/core/table';
import { TableData } from '@/types/table';
import { ActionRegistry } from '@/lib/actions/registry';
import { ActionSyncService } from '@/lib/actions/sync-service';
import { SaveHandler } from '@/lib/actions/handlers/save-handler';
import { PromptSuggestions } from "@/components/core/prompt-suggestions";
import { PromptBox } from "@/components/core/prompt-box";
import styles from "./page.module.css";
import { DeleteHandler } from '@/lib/actions/handlers/delete-handler';
import { ViewHandler } from '@/lib/actions/handlers/view-handler';
import { EditHandler } from '@/lib/actions/handlers/edit-handler';

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize action handlers
  useEffect(() => {
    // Get registry instance
    const registry = ActionRegistry.getInstance();
    
    // Register our action handlers
    registry.registerHandler('save', new SaveHandler());
    registry.registerHandler('delete', new DeleteHandler());
    registry.registerHandler('view', new ViewHandler());
    registry.registerHandler('edit', new EditHandler());
    
    // Start the sync service to get handlers from the backend
    const syncService = ActionSyncService.getInstance();
    syncService.configure({
      apiUrl: '/api/action-handlers',
      syncIntervalMs: 5 * 60 * 1000 // 5 minutes
    });
    syncService.startSync();
    
    // Clean up when component unmounts
    return () => {
      syncService.stopSync();
    };
  }, []);

  async function fetchTableData(userPrompt: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userPrompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMessage = data.error || "Failed to fetch table data";
        const errorDetails = data.details ? JSON.stringify(data.details) : null;
        throw new Error(errorDetails || errorMessage);
      }
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
      setTableData(data);
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setTableData(null);
    } finally {
      setLoading(false);
    }
  }

  function handlePromptSubmit() {
    if (!prompt.trim()) return;
    fetchTableData(prompt);
  }

  function handleSuggestionClick(suggestion: string) {
    setPrompt(suggestion);
    fetchTableData(suggestion);
  }

  // Handle table data updates from actions
  const handleTableDataUpdate = (updatedData: TableData) => {
    setTableData(updatedData);
  };

  // Context to pass to action handlers
  const actionContext = {
    userId: 'user-123',
    tableId: 'main-table',
    viewId: 'main-view',
    tableTitle: tableData?.title
  };

  return (
    <div className={styles.homeContainer}>
      <div className={styles.promptContainer}>
        <PromptBox
          prompt={prompt}
          setPrompt={setPrompt}
          onSubmit={handlePromptSubmit}
          loading={loading}
        />
        <PromptSuggestions 
          onSuggestionClick={handleSuggestionClick} 
          loading={loading} 
        />
      </div>
      
      <div className={styles.tableContainer}>
        <Table
          tableData={tableData}
          loading={loading}
          error={error}
          title={tableData?.title || "New table"}
          actionContext={actionContext}
          onDataUpdate={handleTableDataUpdate}
        />
      </div>
    </div>
  );
}

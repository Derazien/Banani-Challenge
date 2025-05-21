'use client';

import React from 'react';
import { 
  ActionHandler, 
  ActionHandlerMetadata, 
  ActionHandlerConfig, 
  ActionContext, 
  ActionResult 
} from '../types';
import dynamic from 'next/dynamic';
import { createRoot } from 'react-dom/client';

// Dynamic import to avoid SSR issues
const EditForm = dynamic(() => import('../../../components/forms/edit-form').then(mod => mod.EditForm), {
  ssr: false
});

const Modal = dynamic(() => import('../../../components/ui/modal').then(mod => mod.Modal), {
  ssr: false
});

// Handler version - will be updated from env later
const HANDLER_VERSION = '1.0.0';

/**
 * EditHandler allows editing item data in a modal form
 */
export class EditHandler implements ActionHandler {
  private config: ActionHandlerConfig;
  private metadata: ActionHandlerMetadata;
  
  constructor(config?: ActionHandlerConfig) {
    this.config = config || {
      enabled: true,
      settings: {
        openInModal: true,
        validateOnChange: true
      }
    };
    
    this.metadata = {
      type: 'edit',
      name: 'Edit Handler',
      description: 'Allows editing item data in a modal form',
      version: HANDLER_VERSION,
      icon: 'edit'
    };
  }
  
  /**
   * Execute the edit action, showing edit form in a modal
   */
  public async execute(rowData: any, context?: ActionContext): Promise<ActionResult> {
    // Ensure the handler is enabled
    if (!this.config.enabled) {
      return {
        success: false,
        message: 'The edit action is currently disabled'
      };
    }
    
    try {
      // Create a Promise to handle the async modal interaction
      return new Promise<ActionResult>((resolve) => {
        const title = `Edit ${this.getItemName(rowData)}`;
        
        // Create a container for our React component
        const container = document.createElement('div');
        container.id = 'edit-modal-container';
        // Ensure z-index is high enough
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        
        // Function to clean up the container
        const cleanupContainer = () => {
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
        };
        
        // Create a React root for the container
        const root = createRoot(container);
        
        // Handle cancel action
        const handleCancel = () => {
          resolve({
            success: true,
            message: 'Edit cancelled',
            data: {
              cancelled: true,
              id: rowData.id
            }
          });
          
          // Cleanup
          root.unmount();
          cleanupContainer();
        };
        
        // Handle save action
        const handleSave = (updatedData: any) => {
          // Ensure updatedData has required ID
          if (!updatedData || !updatedData.id) {
            console.error('Updated data is missing required ID field');
            resolve({
              success: false,
              message: 'Failed to update: Missing ID field',
              error: 'Missing ID field in updated data'
            });
            
            // Cleanup
            root.unmount();
            cleanupContainer();
            return;
          }
          
          // Call the updateData function from context if available
          if (context?.updateData) {
            try {
              context.updateData(updatedData);
            } catch (error) {
              console.error('Error while updating data through context:', error);
              resolve({
                success: false,
                message: 'Failed to update data',
                error: error instanceof Error ? error.message : 'Unknown error'
              });
              
              // Cleanup
              root.unmount();
              cleanupContainer();
              return;
            }
          } else {
            console.warn('No updateData function provided in context. Attempting direct storage update...');
            
            // Try to update storage directly
            try {
              const { TableStorageManager } = require('../../../lib/storage/table-storage-manager');
              const storageManager = TableStorageManager.getInstance();
              
              // Get table ID from different potential sources
              const tableId = updatedData.tableKey || context?.tableId || context?.tableTitle;
              
              if (!tableId) {
                throw new Error('Unable to determine table ID for update');
              }
              
              // Get the current table
              let currentTable = storageManager.getTableByKey(tableId);
              
              // Try alternative lookup methods if needed
              if (!currentTable && typeof tableId === 'string') {
                currentTable = storageManager.getTableByTitle(tableId);
              }
              
              if (currentTable) {
                // Verify item exists in table
                const itemExists = currentTable.rows.some((row: Record<string, any>) => 
                  row.id === updatedData.id
                );
                
                if (!itemExists) {
                  console.warn(`Item with ID ${updatedData.id} not found in table ${tableId}`);
                }
                
                // Update the row in the table
                const updatedRows = currentTable.rows.map((row: Record<string, any>) => 
                  row.id === updatedData.id ? {...row, ...updatedData} : row
                );
                
                // Create updated table
                const updatedTable = {
                  ...currentTable,
                  rows: updatedRows
                };
                
                // Save to storage
                storageManager.saveTable(updatedTable);
                
                // Synchronize UI
                storageManager.synchronizeUI();
                
                console.log('Item updated directly in storage');
              } else {
                throw new Error('Could not find the table to update');
              }
            } catch (error) {
              console.error('Failed to update item directly in storage:', error);
              
              // Return a warning
              resolve({
                success: true,
                message: 'Item updated in UI only. Unable to save to storage.',
                data: updatedData,
                warning: 'Storage update function not available'
              });
              
              // Cleanup and return early
              root.unmount();
              cleanupContainer();
              return;
            }
          }
          
          resolve({
            success: true,
            message: 'Item updated successfully',
            data: updatedData
          });
          
          // Cleanup
          root.unmount();
          cleanupContainer();
        };
        
        // Render the modal with edit form
        root.render(
          <Modal 
            isOpen={true}
            onClose={handleCancel}
            title={title}
          >
            <EditForm 
              item={rowData} 
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </Modal>
        );
      });
    } catch (error: unknown) {
      console.error('Error in edit handler:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `Failed to edit item: ${errorMessage}`
      };
    }
  }
  
  /**
   * Get a name for the item based on its data
   */
  private getItemName(rowData: any): string {
    // Look for common name fields
    for (const field of ['name', 'title', 'label', 'subject']) {
      if (rowData[field] && typeof rowData[field] === 'string') {
        return rowData[field];
      }
    }
    
    // Fall back to ID or default
    return rowData.id ? `Item #${rowData.id}` : 'Item';
  }
  
  /**
   * Get handler metadata
   */
  public getMetadata(): ActionHandlerMetadata {
    return this.metadata;
  }
  
  /**
   * Update handler configuration
   */
  public updateConfig(config: ActionHandlerConfig): void {
    this.config = { ...this.config, ...config };
  }
} 
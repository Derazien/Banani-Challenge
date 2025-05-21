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
const ConfirmDialog = dynamic(
  () => import('../../../components/modals/confirm-dialog').then(mod => mod.ConfirmDialog),
  { ssr: false }
);

// Handler version - will be updated from env later
const HANDLER_VERSION = '1.0.0';

/**
 * DeleteHandler removes items with confirmation
 */
export class DeleteHandler implements ActionHandler {
  private config: ActionHandlerConfig;
  private metadata: ActionHandlerMetadata;
  
  constructor(config?: ActionHandlerConfig) {
    this.config = config || {
      enabled: true,
      settings: {
        confirmBeforeDelete: true
      }
    };
    
    this.metadata = {
      type: 'delete',
      name: 'Delete Handler',
      description: 'Removes items with confirmation',
      version: HANDLER_VERSION,
      icon: 'delete'
    };
  }
  
  /**
   * Execute the delete action with confirmation
   */
  public async execute(rowData: any, context?: ActionContext): Promise<ActionResult> {
    // Ensure the handler is enabled
    if (!this.config.enabled) {
      return {
        success: false,
        message: 'The delete action is currently disabled'
      };
    }
    
    // Get settings
    const { confirmBeforeDelete } = this.config.settings || {
      confirmBeforeDelete: true
    };
    
    try {
      // Extract item ID
      const { id } = rowData;
      
      if (!id) {
        return {
          success: false,
          message: 'Cannot delete item without ID'
        };
      }
      
      // Skip confirmation if configured to do so
      if (!confirmBeforeDelete) {
        return this.performDelete(id, rowData, context);
      }
      
      // Create a Promise to handle the async confirmation
      return new Promise<ActionResult>((resolve) => {
        // Get a user-friendly name to display in the confirmation
        const itemName = this.getItemName(rowData);
        
        // Create dialog component
        const dialogContainer = document.createElement('div');
        dialogContainer.id = 'delete-dialog-container';
        document.body.appendChild(dialogContainer);
        
        // Create a function to clean up the dialog container
        const cleanupDialog = () => {
          if (document.body.contains(dialogContainer)) {
            document.body.removeChild(dialogContainer);
          }
        };
        
        // Render the dialog into the container using ReactDOM
        const root = createRoot(dialogContainer);
        
        const handleConfirm = async () => {
          const result = await this.performDelete(id, rowData, context);
          resolve(result);
          cleanupDialog();
          root.unmount();
        };
        
        const handleCancel = () => {
          resolve({
            success: true,
            message: 'Delete cancelled',
            data: {
              cancelled: true,
              id
            }
          });
          cleanupDialog();
          root.unmount();
        };
        
        // Render confirmation dialog
        root.render(
          <ConfirmDialog
            isOpen={true}
            title="Confirm Delete"
            message={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            type="delete"
            onClose={handleCancel}
            onConfirm={handleConfirm}
          />
        );
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `Delete operation failed: ${errorMessage}`
      };
    }
  }
  
  /**
   * Perform the actual delete operation
   */
  private async performDelete(
    id: string,
    rowData: any,
    context?: ActionContext
  ): Promise<ActionResult> {
    try {
      // Call the removeItem function from context if available
      if (context?.removeItem) {
        context.removeItem(id);
      } else {
        console.warn('No removeItem function provided in context');
      }
      
      return {
        success: true,
        message: 'Item deleted successfully',
        data: {
          id,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete item: ${errorMessage}`);
    }
  }
  
  /**
   * Get a user-friendly name for the item
   */
  private getItemName(rowData: any): string {
    // Look for common name fields
    for (const field of ['name', 'title', 'label', 'subject', 'description']) {
      if (rowData[field] && typeof rowData[field] === 'string') {
        return rowData[field] as string;
      }
    }
    
    // Fall back to ID or default
    return rowData.id ? `Item #${rowData.id}` : 'Selected Item';
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
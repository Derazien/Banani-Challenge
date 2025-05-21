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
          // Call the updateData function from context if available
          if (context?.updateData) {
            context.updateData(updatedData);
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
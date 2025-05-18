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

// Dynamic imports to avoid SSR issues
const ItemDetailView = dynamic(() => import('../../../components/ui/item-detail-view').then(mod => mod.ItemDetailView), {
  ssr: false
});

const Modal = dynamic(() => import('../../../components/ui/modal').then(mod => mod.Modal), {
  ssr: false
});

// Handler version - will be updated from env later
const HANDLER_VERSION = '1.0.0';

/**
 * ViewHandler shows item details using a React modal
 */
export class ViewHandler implements ActionHandler {
  private config: ActionHandlerConfig;
  private metadata: ActionHandlerMetadata;
  
  constructor(config?: ActionHandlerConfig) {
    this.config = config || {
      enabled: true,
      settings: {
        openInModal: true
      }
    };
    
    this.metadata = {
      type: 'view',
      name: 'View Handler',
      description: 'Shows item details in a modal',
      version: HANDLER_VERSION,
      icon: 'view'
    };
  }
  
  /**
   * Execute the view action, showing item details in a modal
   */
  public async execute(rowData: any, context?: ActionContext): Promise<ActionResult> {
    // Ensure the handler is enabled
    if (!this.config.enabled) {
      return {
        success: false,
        message: 'The view action is currently disabled'
      };
    }
    
    try {
      // Create a Promise to handle the async modal interaction
      return new Promise<ActionResult>((resolve) => {
        const title = this.getItemTitle(rowData, context?.tableTitle);
        
        // Create a container for our React component
        const container = document.createElement('div');
        container.id = 'view-modal-container';
        document.body.appendChild(container);
        
        // Create a function to clean up the container
        const cleanupContainer = () => {
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
        };
        
        // Create a React root for the container
        const root = createRoot(container);
        
        // Handle modal close
        const handleClose = () => {
          resolve({
            success: true,
            message: 'Viewed item details',
            data: {
              id: rowData.id
            }
          });
          
          // Cleanup
          root.unmount();
          cleanupContainer();
        };
        
        // Render the modal with item details
        root.render(
          <Modal 
            isOpen={true}
            onClose={handleClose}
            title={title}
          >
            <ItemDetailView item={rowData} />
          </Modal>
        );
      });
    } catch (error: unknown) {
      console.error('Error in view handler:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `Failed to show item details: ${errorMessage}`
      };
    }
  }
  
  /**
   * Get a title for the item based on its data
   */
  private getItemTitle(rowData: any, tableTitle?: string): string {
    // Look for common title fields
    for (const field of ['title', 'name', 'label', 'subject']) {
      if (rowData[field] && typeof rowData[field] === 'string') {
        return rowData[field];
      }
    }
    
    // Try to create a title using the table title and ID
    if (tableTitle) {
      return `${tableTitle} Item Details`;
    }
    
    // Default title
    return 'Item Details';
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
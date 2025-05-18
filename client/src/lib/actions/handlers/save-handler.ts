import { 
  ActionHandler, 
  ActionHandlerMetadata, 
  ActionHandlerConfig, 
  ActionContext, 
  ActionResult 
} from '../types';

// Handler version - will be updated from env later
const HANDLER_VERSION = '1.0.0';

/**
 * SaveHandler provides bookmark/save functionality
 */
export class SaveHandler implements ActionHandler {
  private config: ActionHandlerConfig;
  private metadata: ActionHandlerMetadata;
  private storage: Storage | null = null;
  private storageKey = 'saved_items';
  
  constructor(config?: ActionHandlerConfig) {
    this.config = config || {
      enabled: true,
      settings: {
        storageType: 'local', // 'local' or 'session'
        maxItems: 50
      }
    };
    
    this.metadata = {
      type: 'save',
      name: 'Save Handler',
      description: 'Allows saving/bookmarking items',
      version: HANDLER_VERSION,
      icon: 'bookmark'
    };
    
    // Initialize storage if in browser
    if (typeof window !== 'undefined') {
      this.storage = this.config.settings?.storageType === 'session' 
        ? window.sessionStorage 
        : window.localStorage;
    }
  }
  
  /**
   * Execute the save action - toggle saved state
   */
  public async execute(rowData: any, context?: ActionContext): Promise<ActionResult> {
    // Ensure the handler is enabled
    if (!this.config.enabled) {
      return {
        success: false,
        message: 'The save action is currently disabled'
      };
    }
    
    // We need browser storage to save items
    if (!this.storage) {
      return {
        success: false,
        message: 'Cannot save items (not in browser environment)'
      };
    }
    
    try {
      const { id } = rowData;
      
      if (!id) {
        return {
          success: false,
          message: 'Cannot save item without ID'
        };
      }
      
      // Check if item is already saved
      const isSaved = this.isItemSaved(id);
      
      if (isSaved) {
        // If already saved, remove it
        this.removeFromSaved(id);
        return {
          success: true,
          message: 'Item removed from saved items',
          data: {
            id,
            saved: false
          }
        };
      } else {
        // If not saved, save it
        this.addToSaved(rowData);
        return {
          success: true,
          message: 'Item saved successfully',
          data: {
            id,
            saved: true
          }
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `Failed to save item: ${errorMessage}`
      };
    }
  }
  
  /**
   * Check if an item is already saved
   */
  public isItemSaved(id: string): boolean {
    if (!this.storage) {
      return false;
    }
    
    const savedItemsJson = this.storage.getItem(this.storageKey);
    if (!savedItemsJson) {
      return false;
    }
    
    try {
      const savedItems = JSON.parse(savedItemsJson);
      return savedItems.some((item: any) => item.id === id);
    } catch {
      return false;
    }
  }
  
  /**
   * Add an item to saved items
   */
  private addToSaved(item: any): void {
    if (!this.storage) return;
    
    let savedItems: any[] = [];
    const savedItemsJson = this.storage.getItem(this.storageKey);
    
    if (savedItemsJson) {
      try {
        savedItems = JSON.parse(savedItemsJson);
      } catch {
        savedItems = [];
      }
    }
    
    // Remove existing item with same ID if present
    savedItems = savedItems.filter(savedItem => savedItem.id !== item.id);
    
    // Add the new item
    savedItems.push(item);
    
    // Limit to max items if specified
    const maxItems = this.config.settings?.maxItems || 50;
    if (savedItems.length > maxItems) {
      savedItems = savedItems.slice(-maxItems);
    }
    
    // Save back to storage
    this.storage.setItem(this.storageKey, JSON.stringify(savedItems));
  }
  
  /**
   * Remove an item from saved items
   */
  private removeFromSaved(id: string): void {
    if (!this.storage) return;
    
    const savedItemsJson = this.storage.getItem(this.storageKey);
    if (!savedItemsJson) return;
    
    try {
      let savedItems = JSON.parse(savedItemsJson);
      savedItems = savedItems.filter((item: any) => item.id !== id);
      this.storage.setItem(this.storageKey, JSON.stringify(savedItems));
    } catch {
      // If there's an error parsing, just ignore
    }
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
    
    // Update storage type if it changed
    if (typeof window !== 'undefined') {
      this.storage = this.config.settings?.storageType === 'session' 
        ? window.sessionStorage 
        : window.localStorage;
    }
  }
} 
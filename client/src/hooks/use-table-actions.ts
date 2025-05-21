import { useState, useEffect } from 'react';
import { ActionRegistry } from '@/lib/actions/registry';
import { SaveHandler } from '@/lib/actions/handlers/save-handler';
import { ActionContext } from '@/lib/actions/types';
import { TableData } from '@/types/table';

/**
 * @function
 * @param {TableData|null} initialTableData - Initial table data
 * @param {ActionContext} [actionContext] - Optional action context
 * @param {Function} [onDataUpdate] - Optional callback for data updates
 * @returns {Object} Table action state and functions
 * Custom hook for handling table actions
 */
export function useTableActions(
  initialTableData: TableData | null,
  actionContext?: ActionContext,
  onDataUpdate?: (newData: TableData) => void
) {
  const [savedItems, setSavedItems] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [actionMessages, setActionMessages] = useState<Record<string, string>>({});
  
  const actionRegistry = ActionRegistry.getInstance();
  
  // Load saved items on component mount
  useEffect(() => {
    const registry = ActionRegistry.getInstance();
    const saveHandler = registry.getHandler('save') as SaveHandler | undefined;
    if (saveHandler) {
      try {
        if (typeof saveHandler.getSavedItems === 'function') {
          const items = saveHandler.getSavedItems();
          const savedState: Record<string, boolean> = {};
          items.forEach(item => {
            if (item && item.id) savedState[item.id] = true;
          });
          setSavedItems(savedState);
        } else {
          setSavedItems({});
        }
      } catch (error) {
        console.error('Error loading saved items:', error);
        setSavedItems({});
      }
    }
  }, []);

  /**
   * @function
   * @param {any} updatedItem - The item with updated data
   * @returns {void}
   */
  const handleItemUpdate = (updatedItem: any) => {
    if (!initialTableData || !updatedItem || !updatedItem.id) return;
    
    // Create new rows array with the updated item
    const updatedRows = initialTableData.rows.map(row => 
      row.id === updatedItem.id ? {...row, ...updatedItem} : row
    );
    
    // Create a new table data object
    const updatedTableData = { 
      ...initialTableData, 
      rows: updatedRows 
    };
    
    if (onDataUpdate) {
      // Notify parent
      onDataUpdate(updatedTableData);
    } else {
      // If no parent callback, update storage directly
      try {
        const { TableStorageManager } = require('@/lib/storage/table-storage-manager');
        const storageManager = TableStorageManager.getInstance();
        storageManager.saveTable(updatedTableData);
        console.log('Table data updated directly in storage:', updatedTableData.key);
      } catch (error) {
        console.error('Failed to update table data in storage:', error);
      }
    }
  };
  
  /**
   * @function
   * @param {string} itemId - ID of the item to remove
   * @returns {void}
   */
  const handleItemRemove = (itemId: string) => {
    if (!initialTableData || !itemId) {
      return;
    }
    
    // Double-check that the item exists in this table
    const itemExists = initialTableData.rows.some(row => row.id === itemId);
    if (!itemExists) {
      console.error(`Item with ID ${itemId} not found in table ${initialTableData.key}`);
      return;
    }
    
    // Filter out the removed item
    const filteredRows = initialTableData.rows.filter(row => row.id !== itemId);
    
    // Create a new table data object
    const updatedTableData = { 
      ...initialTableData, 
      rows: filteredRows 
    };
    
    if (onDataUpdate) {
      // Notify parent
      onDataUpdate(updatedTableData);
    } else {
      // If no parent callback, update storage directly
      try {
        const { TableStorageManager } = require('@/lib/storage/table-storage-manager');
        const storageManager = TableStorageManager.getInstance();
        storageManager.saveTable(updatedTableData);
        console.log('Item removed and table updated directly in storage:', updatedTableData.key);
      } catch (error) {
        console.error('Failed to remove item from table in storage:', error);
      }
    }
  };

  /**
   * @function
   * @param {string} actionType - Type of action to execute
   * @param {any} item - Item to perform action on
   * @returns {Promise<void>}
   */
  const handleAction = async (actionType: string, item: any) => {
    const handler = actionRegistry.getHandler(actionType);
    if (!handler) {
      console.error(`No handler registered for action type: ${actionType}`);
      
      // Display an error message directly
      setActionMessages(prev => ({ 
        ...prev, 
        [item.id]: `Error: Action ${actionType} not available` 
      }));
      setTimeout(() => setActionMessages(prev => { 
        const newState = {...prev}; 
        delete newState[item.id]; 
        return newState; 
      }), 3000);
      
      return;
    }
    
    // Set action as loading
    setActionLoading(prev => ({ ...prev, [`${item.id}-${actionType}`]: true }));
    
    try {
      // Create a context with row-specific handlers
      const rowContext = {
        ...actionContext,
        // These functions let the handlers update/remove rows
        updateData: (updatedData: any) => handleItemUpdate(updatedData),
        removeItem: (itemId: string, tableId?: string) => {
          // Only use parent context's removeItem (from page.tsx)
          // This eliminates dual responsibility and prevents double-saving
          if (actionContext?.removeItem) {
            // Use the item's tableKey if no tableId provided
            const effectiveTableId = tableId || item.tableKey;
            actionContext.removeItem(itemId, effectiveTableId);
          } else {
            // Fallback only if parent context doesn't have removeItem
            handleItemRemove(itemId);
          }
        }
      };
      
      // Execute the handler
      const result = await handler.execute(item, rowContext);
      
      if (result.success) {
        // Handle specific action success cases
        switch(actionType) {
          case 'save':
            // Toggle saved state
            setSavedItems(prev => ({ ...prev, [item.id]: !prev[item.id] }));
            break;
            
          case 'delete':
            // For delete, we don't need to update anything
            // The item has already been removed in the removeItem function
            break;
            
          default:
            // For other actions with data response
            if (result.data) {
              // Skip if the data only contains an id (which might be from a delete operation)
              const hasOnlyId = Object.keys(result.data).length === 1 && 'id' in result.data;
              if (!hasOnlyId) {
                handleItemUpdate(result.data);
              }
            }
        }
        
        // Show success message if provided
        if (result.message) {
          setActionMessages(prev => ({ ...prev, [item.id]: result.message! }));
          setTimeout(() => setActionMessages(prev => { 
            const newState = {...prev}; 
            delete newState[item.id]; 
            return newState; 
          }), 3000);
        }
      } else {
        // Handle failure
        const errorMessage = result.error || "Action failed";
        setActionMessages(prev => ({ ...prev, [item.id]: `Error: ${errorMessage}` }));
        setTimeout(() => setActionMessages(prev => { 
          const newState = {...prev}; 
          delete newState[item.id]; 
          return newState; 
        }), 3000);
        console.error(`Action ${actionType} failed:`, errorMessage);
      }
    } catch (error) {
      // Handle exceptions
      console.error(`Error executing action ${actionType}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setActionMessages(prev => ({ ...prev, [item.id]: `Error: ${errorMessage}` }));
      setTimeout(() => setActionMessages(prev => { 
        const newState = {...prev}; 
        delete newState[item.id]; 
        return newState; 
      }), 3000);
    } finally {
      // Always clear the loading state
      setActionLoading(prev => { 
        const newState = {...prev}; 
        delete newState[`${item.id}-${actionType}`]; 
        return newState; 
      });
    }
  };
  
  /**
   * @function
   * @param {any} action - The action object
   * @param {string} itemId - ID of the item 
   * @param {Function} getIcon - Function to get an icon
   * @returns {React.ReactNode} The icon to display
   */
  const getActionIcon = (action: any, itemId: string, getIcon: (name: string) => React.ReactNode) => {
    // Show loading spinner if this action is loading for this item
    if (actionLoading[`${itemId}-${action.type}`]) {
      return getIcon('loading');
    }
    
    // Special case for save action (toggle between filled and outline)
    if (action.type === 'save') {
      return savedItems[itemId] ? getIcon('bookmark-filled') : getIcon('bookmark');
    }
    
    // For all other actions, use the icon registry with action type as fallback
    return getIcon(action.icon || action.type);
  };
  
  return {
    savedItems,
    actionLoading,
    actionMessages,
    handleAction,
    getActionIcon
  };
} 
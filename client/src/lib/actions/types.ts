// Import the TableData type 
import { TableData } from '@/types/table';

// Define the result of an action execution
export interface ActionResult {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
  error?: string;
}

// Define the action handler interface that all handlers must implement
export interface ActionHandler {
  // Execute the action with the provided row data and optional context
  execute: (rowData: Record<string, unknown>, context?: ActionContext) => Promise<ActionResult>;
  
  // Get handler metadata
  getMetadata: () => ActionHandlerMetadata;
  
  // Update handler configuration
  updateConfig: (config: ActionHandlerConfig) => void;
}

// Define context that can be passed to action handlers
export interface ActionContext {
  userId?: string;
  tableId?: string;
  viewId?: string;
  tableTitle?: string;
  tableData?: TableData;
  updateData?: (updatedItem: Record<string, unknown>) => void;
  removeItem?: (itemId: string) => void;
  [key: string]: unknown;
}

// Define metadata for action handlers
export interface ActionHandlerMetadata {
  type: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  icon?: string;
}

// Define configuration for action handlers
export interface ActionHandlerConfig {
  enabled: boolean;
  permissions?: string[];
  settings?: Record<string, unknown>;
  endpoints?: Record<string, string>;
  customCode?: string;
  metadata?: ActionHandlerMetadata;
}

// Define API response format for action handler configurations
export interface ActionHandlerConfigResponse {
  type: string;
  version: string;
  config: ActionHandlerConfig;
  code?: string; // Optional encrypted or stringified code
}

// Type definitions for the dynamic-handler module
export interface DynamicHandlerModule {
  createDynamicHandler: (
    type: string,
    code: string,
    config: ActionHandlerConfig
  ) => Promise<ActionHandler>;
  
  decryptHandlerCode: (encryptedCode: string, key: string) => string;
} 
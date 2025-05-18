// Define the result of an action execution
export interface ActionResult {
  success: boolean;
  message?: string;
  data?: any;
}

// Define the action handler interface that all handlers must implement
export interface ActionHandler {
  // Execute the action with the provided row data and optional context
  execute: (rowData: any, context?: ActionContext) => Promise<ActionResult>;
  
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
  tableData?: any;
  updateData?: (updatedItem: any) => void;
  removeItem?: (itemId: string) => void;
  [key: string]: any;
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
  settings?: Record<string, any>;
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

// Create a declaration for the semver module
declare module 'semver';

// Create a declaration for the dynamic-handler module
declare module './dynamic-handler' {
  import { ActionHandler, ActionHandlerConfig } from './types';
  
  export function createDynamicHandler(
    type: string,
    code: string,
    config: ActionHandlerConfig
  ): Promise<ActionHandler>;
  
  export function decryptHandlerCode(encryptedCode: string, key: string): string;
} 
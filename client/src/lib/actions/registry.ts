import { ActionHandler, ActionHandlerConfig, ActionContext, ActionResult } from './types';

/**
 * ActionRegistry is a singleton that manages all available action handlers
 */
export class ActionRegistry {
  private static instance: ActionRegistry;
  private handlers: Map<string, ActionHandler> = new Map();
  private logger: Console = console;

  private constructor() {
    // Private constructor to prevent direct construction calls with 'new'
  }

  /**
   * Get the singleton instance of ActionRegistry
   */
  public static getInstance(): ActionRegistry {
    if (!ActionRegistry.instance) {
      ActionRegistry.instance = new ActionRegistry();
    }
    return ActionRegistry.instance;
  }

  /**
   * Register a new action handler
   */
  public registerHandler(type: string, handler: ActionHandler): void {
    if (this.handlers.has(type)) {
      this.logger.warn(`Handler for action type "${type}" already exists. Overwriting.`);
    }
    this.handlers.set(type, handler);
    this.logger.info(`Registered handler for action type "${type}"`);
  }

  /**
   * Get an action handler by type
   */
  public getHandler(type: string): ActionHandler | undefined {
    return this.handlers.get(type);
  }

  /**
   * Check if a handler exists for a given action type
   */
  public hasHandler(type: string): boolean {
    return this.handlers.has(type);
  }

  /**
   * Remove a handler
   */
  public removeHandler(type: string): boolean {
    return this.handlers.delete(type);
  }

  /**
   * Update a handler's configuration
   */
  public updateHandlerConfig(type: string, config: ActionHandlerConfig): void {
    const handler = this.handlers.get(type);
    
    if (!handler) {
      this.logger.warn(`Cannot update config for non-existent handler "${type}"`);
      return;
    }
    
    handler.updateConfig(config);
    this.logger.info(`Updated configuration for handler "${type}"`);
  }

  /**
   * Execute an action with the appropriate handler
   */
  public async executeAction(
    type: string, 
    rowData: any, 
    context?: ActionContext
  ): Promise<ActionResult> {
    const handler = this.handlers.get(type);
    
    if (!handler) {
      this.logger.error(`No handler registered for action type "${type}"`);
      return {
        success: false,
        message: `No handler available for action type "${type}"`,
      };
    }
    
    try {
      return await handler.execute(rowData, context);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error executing action "${type}":`, error);
      return {
        success: false,
        message: `Action execution failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Get all registered handler types
   */
  public getHandlerTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
  
  /**
   * Get all registered handlers with their metadata
   */
  public getAllHandlersMetadata(): Record<string, any> {
    const metadata: Record<string, any> = {};
    
    this.handlers.forEach((handler, type) => {
      metadata[type] = handler.getMetadata();
    });
    
    return metadata;
  }
} 
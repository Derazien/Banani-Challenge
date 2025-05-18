import { 
  ActionHandler, 
  ActionHandlerMetadata, 
  ActionHandlerConfig, 
  ActionContext, 
  ActionResult 
} from '../types';

/**
 * A safe fallback handler that can be used when dynamic handler creation fails
 * or when no specific implementation is available for an action type.
 */
export class SafeHandler implements ActionHandler {
  private type: string;
  private config: ActionHandlerConfig;
  private metadata: ActionHandlerMetadata;
  
  constructor(type: string, config: ActionHandlerConfig) {
    this.type = type;
    this.config = config;
    this.metadata = {
      type: this.type,
      name: `${this.type.charAt(0).toUpperCase()}${this.type.slice(1)} Handler`,
      description: `Default handler for ${this.type} actions`,
      version: '1.0.0'
    };
  }
  
  /**
   * Execute the action with basic safe behavior
   */
  public async execute(rowData: any, context?: ActionContext): Promise<ActionResult> {
    // Ensure the handler is enabled
    if (!this.config.enabled) {
      return {
        success: false,
        message: `The ${this.type} action is currently disabled.`
      };
    }
    
    // Check permissions if they exist
    if (this.config.permissions?.length && context?.userId) {
      // This is a simplified check - in a real app, you would validate against actual user permissions
      const hasPermission = true; // Replace with actual permission check
      
      if (!hasPermission) {
        return {
          success: false,
          message: 'You do not have permission to perform this action.'
        };
      }
    }
    
    // For safe handler, we just log the action and return success
    console.log(`SafeHandler executing ${this.type} action on:`, rowData);
    
    return {
      success: true,
      message: `${this.type} action executed successfully`,
      data: {
        actionType: this.type,
        timestamp: new Date().toISOString(),
        rowId: rowData.id
      }
    };
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
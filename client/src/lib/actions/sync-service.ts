import { ActionRegistry } from './registry';
import { 
  ActionHandlerMetadata,
  ActionHandlerConfig
} from './types';
import { createDynamicHandler } from './dynamic-handler';
import { SafeHandler } from './handlers/safe-handler';
import * as semver from 'semver';

// Frontend version for compatibility checking
const FRONTEND_VERSION = '1.0.0';

/**
 * Service responsible for synchronizing action handlers with the backend
 */
export class ActionSyncService {
  private static instance: ActionSyncService;
  private registry: ActionRegistry;
  private syncInterval: NodeJS.Timeout | null = null;
  private syncIntervalMs: number = 5 * 60 * 1000; // 5 minutes by default
  private apiUrl: string = '/api/table/action-handlers'; // Direct call to backend through proxy
  private logger: Console = console;
  
  private constructor() {
    this.registry = ActionRegistry.getInstance();
  }
  
  /**
   * Get the singleton instance of ActionSyncService
   */
  public static getInstance(): ActionSyncService {
    if (!ActionSyncService.instance) {
      ActionSyncService.instance = new ActionSyncService();
    }
    return ActionSyncService.instance;
  }
  
  /**
   * Configure the sync service
   */
  public configure(config: {
    syncIntervalMs?: number;
    apiUrl?: string;
  }): void {
    if (config.syncIntervalMs) {
      this.syncIntervalMs = config.syncIntervalMs;
    }
    
    if (config.apiUrl) {
      this.apiUrl = config.apiUrl;
    }
  }
  
  /**
   * Start periodic synchronization with the backend
   */
  public startSync(): void {
    if (this.syncInterval) {
      this.logger.warn('Sync already running. Stopping existing sync first.');
      this.stopSync();
    }
    
    // Perform initial sync immediately
    this.sync().catch(error => {
      this.logger.error('Initial sync failed:', error);
    });
    
    // Setup periodic sync
    this.syncInterval = setInterval(() => {
      this.sync().catch(error => {
        this.logger.error('Periodic sync failed:', error);
      });
    }, this.syncIntervalMs);
    
    this.logger.info(`Started action handler sync with interval of ${this.syncIntervalMs}ms`);
  }
  
  /**
   * Stop periodic synchronization
   */
  public stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      this.logger.info('Stopped action handler sync');
    }
  }
  
  /**
   * Check if a specific handler type needs updating
   */
  public async checkForUpdates(handlerType: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/check-updates?type=${handlerType}&frontendVersion=${FRONTEND_VERSION}`);
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      return data.needsUpdate;
    } catch (error) {
      this.logger.error(`Failed to check for updates for handler ${handlerType}:`, error);
      return false;
    }
  }
  
  /**
   * Perform a single sync operation with the backend
   */
  public async sync(): Promise<void> {
    this.logger.info('Syncing action handlers from backend...');
    
    try {
      const response = await fetch(this.apiUrl);
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      this.logger.debug('Received handler configurations:', data);
      
      // Group handlers by type to get the latest version of each type
      const handlersByType = new Map<string, { 
        type: string; 
        version: string; 
        config: Record<string, unknown>; 
        code?: string 
      }>();
      
      // Find the latest version of each handler type
      for (const handler of data) {
        const { type, version } = handler;
        
        const currentHandler = handlersByType.get(type);
        if (!currentHandler || semver.gt(version, currentHandler.version)) {
          handlersByType.set(type, handler);
        }
      }
      
      // Process the latest version of each handler type
      for (const [, handler] of handlersByType.entries()) {
        await this.processHandlerConfig(handler);
      }
      
      this.logger.info(`Successfully synced ${handlersByType.size} action handlers`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Action handler sync failed: ${errorMessage}`);
      throw error;
    }
  }
  
  /**
   * Process handler configurations from the backend
   */
  private async processHandlerConfig(
    handlerData: { 
      type: string; 
      version: string; 
      config: Record<string, unknown>; 
      code?: string 
    }
  ): Promise<void> {
    try {
      const { type, config: rawHandlerConfig, code, version } = handlerData;
      
      // Convert raw config to ActionHandlerConfig
      const handlerConfig: ActionHandlerConfig = {
        enabled: true,
        ...(rawHandlerConfig as Record<string, unknown>)
      };
      
      // Check if we should update this handler
      const currentHandler = this.registry.getHandler(type);
      if (currentHandler) {
        const metadata = currentHandler.getMetadata();
        const currentVersion = metadata.version;
        
        // Skip if the current version is newer or equal
        if (semver.gte(currentVersion, version)) {
          this.logger.debug(`Handler ${type} v${currentVersion} is up-to-date (backend: ${version})`);
          return;
        }
      }
      
      this.logger.info(`Updating handler ${type} to version ${version}`);
      
      if (code) {
        try {
          // Create a dynamic handler from received code
          const handler = await createDynamicHandler(type, code, handlerConfig);
          
          // Update metadata to use the version from the backend
          const metadata = handler.getMetadata();
          const updatedMetadata: ActionHandlerMetadata = {
            ...metadata,
            version
          };
          
          // Set the new metadata
          handler.updateConfig({
            ...handlerConfig,
            metadata: updatedMetadata
          });
          
          this.registry.registerHandler(type, handler);
          this.logger.debug(`Registered new dynamic handler: ${type} v${version}`);
        } catch (dynamicError) {
          // If dynamic handler creation fails, use a safe fallback handler
          this.logger.error(`Failed to create dynamic handler: ${type}`, dynamicError);
          const safeHandler = new SafeHandler(type, {
            ...handlerConfig,
            metadata: {
              type,
              name: `${type.charAt(0).toUpperCase()}${type.slice(1)} Handler`,
              description: `Default handler for ${type} actions`,
              version
            }
          });
          this.registry.registerHandler(type, safeHandler);
          this.logger.debug(`Registered safe fallback handler for: ${type}`);
        }
      } else {
        // No code provided, use a safe handler
        const safeHandler = new SafeHandler(type, {
          ...handlerConfig,
          metadata: {
            type,
            name: `${type.charAt(0).toUpperCase()}${type.slice(1)} Handler`,
            description: `Default handler for ${type} actions`,
            version
          }
        });
        this.registry.registerHandler(type, safeHandler);
        this.logger.debug(`Registered safe handler: ${type}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to process handler config for type ${handlerData.type}: ${errorMessage}`);
    }
  }
} 
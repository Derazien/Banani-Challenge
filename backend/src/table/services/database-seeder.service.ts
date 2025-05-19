import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ActionHandlerService } from './action-handler.service';
import { VersionControlUtil } from '../utils/version-control';

@Injectable()
export class DatabaseSeederService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeederService.name);

  constructor(private readonly actionHandlerService: ActionHandlerService) {}

  /**
   * Run database seeding when the module initializes
   */
  async onModuleInit() {
    this.logger.log('Running database seeding...');
    await this.seedActionHandlers();
    this.logger.log('Database seeding completed');
  }

  /**
   * Seed action handlers into the database
   */
  async seedActionHandlers() {
    // First check if any handlers already exist
    const existingHandlers = await this.actionHandlerService.findAll();
    
    if (existingHandlers.length > 0) {
      this.logger.log(`Found ${existingHandlers.length} existing handlers, skipping seeding`);
      return;
    }
    
    this.logger.log('No existing handlers found, seeding default handlers');
    
    // Define default handlers
    const defaultHandlers = [
      {
        type: 'view',
        name: 'View Handler',
        description: 'Shows detailed view of a table item',
        version: '1.0.0',
        enabled: true,
        frontendVersion: '1.0.0',
        settings: { openInModal: true },
        icon: 'view',
        code: this.getViewHandlerCode()
      },
      {
        type: 'edit',
        name: 'Edit Handler',
        description: 'Allows editing of table items',
        version: '1.0.0',
        enabled: true,
        frontendVersion: '1.0.0',
        settings: { validateOnEdit: true },
        icon: 'edit',
        code: this.getEditHandlerCode()
      },
      {
        type: 'delete',
        name: 'Delete Handler',
        description: 'Handles deletion of table items',
        version: '1.0.0',
        enabled: true,
        frontendVersion: '1.0.0',
        settings: { confirmBeforeDelete: true },
        icon: 'delete',
        code: this.getDeleteHandlerCode()
      },
      {
        type: 'save',
        name: 'Save Handler',
        description: 'Saves or bookmarks table items',
        version: '1.0.0',
        enabled: true,
        frontendVersion: '1.0.0',
        settings: { notifyOnSave: true },
        icon: 'save',
        code: this.getSaveHandlerCode()
      }
    ];
    
    // Create each handler
    for (const handler of defaultHandlers) {
      this.logger.log(`Creating handler: ${handler.type}`);
      await this.actionHandlerService.create(handler);
    }
    
    this.logger.log(`Created ${defaultHandlers.length} default handlers`);
  }
  
  /**
   * Get View Handler Code
   */
  private getViewHandlerCode(): string {
    return `
      // View handler implementation
      class ViewHandler {
        constructor(type, config) {
          this.type = type;
          this.config = config;
          this.metadata = {
            type: type,
            name: 'View Handler',
            description: 'Shows detailed view of a table item',
            version: '1.0.0'
          };
        }
        
        async execute(rowData, context) {
          console.log('View handler executing for:', rowData);
          return {
            success: true,
            message: 'Item details loaded',
            data: rowData
          };
        }
        
        getMetadata() {
          return this.metadata;
        }
        
        updateConfig(config) {
          this.config = {...this.config, ...config};
        }
      }
    `;
  }
  
  /**
   * Get Edit Handler Code
   */
  private getEditHandlerCode(): string {
    return `
      // Edit handler implementation
      class EditHandler {
        constructor(type, config) {
          this.type = type;
          this.config = config;
          this.metadata = {
            type: type,
            name: 'Edit Handler',
            description: 'Allows editing of table items',
            version: '1.0.0'
          };
        }
        
        async execute(rowData, context) {
          console.log('Edit handler executing for:', rowData);
          return {
            success: true,
            message: 'Item ready for editing',
            data: rowData
          };
        }
        
        getMetadata() {
          return this.metadata;
        }
        
        updateConfig(config) {
          this.config = {...this.config, ...config};
        }
      }
    `;
  }
  
  /**
   * Get Delete Handler Code
   */
  private getDeleteHandlerCode(): string {
    return `
      // Delete handler implementation
      class DeleteHandler {
        constructor(type, config) {
          this.type = type;
          this.config = config;
          this.metadata = {
            type: type,
            name: 'Delete Handler',
            description: 'Handles deletion of table items',
            version: '1.0.0'
          };
        }
        
        async execute(rowData, context) {
          console.log('Delete handler executing for:', rowData);
          return {
            success: true,
            message: 'Item successfully deleted',
            data: { id: rowData.id }
          };
        }
        
        getMetadata() {
          return this.metadata;
        }
        
        updateConfig(config) {
          this.config = {...this.config, ...config};
        }
      }
    `;
  }
  
  /**
   * Get Save Handler Code
   */
  private getSaveHandlerCode(): string {
    return `
      // Save handler implementation
      class SaveHandler {
        constructor(type, config) {
          this.type = type;
          this.config = config;
          this.metadata = {
            type: type,
            name: 'Save Handler',
            description: 'Saves or bookmarks table items',
            version: '1.0.0'
          };
        }
        
        async execute(rowData, context) {
          console.log('Save handler executing for:', rowData);
          return {
            success: true,
            message: 'Item saved successfully',
            data: { 
              id: rowData.id,
              isSaved: true,
              timestamp: new Date().toISOString()
            }
          };
        }
        
        getMetadata() {
          return this.metadata;
        }
        
        updateConfig(config) {
          this.config = {...this.config, ...config};
        }
      }
    `;
  }
} 
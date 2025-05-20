import { 
  ActionHandler, 
  ActionHandlerMetadata, 
  ActionHandlerConfig, 
  ActionContext, 
  ActionResult 
} from '../types';
import { exportTableToXLSX } from '@/lib/utils/xlsx-export';
import { TableStorageManager } from '@/lib/storage/table-storage-manager';

// Handler version
const HANDLER_VERSION = '1.0.0';

/**
 * ExportHandler provides XLSX export functionality for tables
 */
export class ExportHandler implements ActionHandler {
  private config: ActionHandlerConfig;
  private metadata: ActionHandlerMetadata;
  
  constructor(config?: ActionHandlerConfig) {
    this.config = config || {
      enabled: true,
      settings: {
        formats: ['xlsx']
      }
    };
    
    this.metadata = {
      type: 'export',
      name: 'Export Handler',
      description: 'Exports table data to XLSX format',
      version: HANDLER_VERSION,
      icon: 'download'
    };
  }
  
  /**
   * Execute the export action
   */
  public async execute(rowData: any, context?: ActionContext): Promise<ActionResult> {
    // Ensure the handler is enabled
    if (!this.config.enabled) {
      return {
        success: false,
        message: 'The export action is currently disabled'
      };
    }
    
    try {
      // For individual row export, we need the whole table data
      if (context?.tableData) {
        // Export the entire table
        exportTableToXLSX(context.tableData);
        
        return {
          success: true,
          message: 'Table exported successfully',
          data: {
            format: 'xlsx',
            timestamp: new Date().toISOString()
          }
        };
      } else {
        // If we don't have table context, try to get the table from storage using the row data
        const tableTitle = rowData.tableTitle || rowData.title;
        if (tableTitle) {
          const storageManager = TableStorageManager.getInstance();
          const tableData = storageManager.getTableByTitle(tableTitle);
          
          if (tableData) {
            exportTableToXLSX(tableData);
            
            return {
              success: true,
              message: 'Table exported successfully',
              data: {
                format: 'xlsx',
                timestamp: new Date().toISOString()
              }
            };
          }
        }
        
        return {
          success: false,
          message: 'Could not find table data to export'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `Failed to export table: ${errorMessage}`
      };
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
  }
} 
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { TableData } from './interfaces/table.interface';

@Injectable()
export class TableService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(TableService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('HUGGINGFACE_API_KEY');
    const baseURL = this.configService.get<string>('HUGGINGFACE_BASE_URL');
    const model = this.configService.get<string>('AI_MODEL_NAME', 'neurospaicy');
    
    this.logger.log('Initializing TableService with configuration...');
    this.logger.debug(`Base URL: ${baseURL}`);
    this.logger.debug(`Model: ${model}`);
    
    if (!apiKey) {
      this.logger.error('HUGGINGFACE_API_KEY environment variable is missing or empty');
      throw new Error('HUGGINGFACE_API_KEY is required to use this service');
    }

    if (!baseURL) {
      this.logger.error('HUGGINGFACE_BASE_URL environment variable is missing or empty');
      throw new Error('HUGGINGFACE_BASE_URL is required to use this service');
    }
    
    try {
      this.openai = new OpenAI({
        apiKey: apiKey,
        baseURL: baseURL,
      });
      this.logger.log(`AI client initialized successfully with model: ${model}`);
    } catch (error) {
      this.logger.error('Failed to initialize AI client:', error);
      throw error;
    }
  }

  async generateTable(prompt: string): Promise<TableData> {
    this.logger.log(`Starting table generation for prompt: "${prompt}"`);
    
    const model = this.configService.get<string>('AI_MODEL_NAME', 'neurospaicy');
    const maxTokens = parseInt(this.configService.get<string>('AI_MAX_TOKENS', '1000'), 1000);
    
    this.logger.debug(`Using model: ${model}, max tokens: ${maxTokens}`);

    try {
      this.logger.log('Sending request to AI model...');
      const completion = await this.openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt()
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        response_format: { type: "json_object" }
      });

      this.logger.log('Received response from AI model');
      this.logger.debug('Raw AI response:', completion);

      const response = completion.choices[0].message.content;
      this.logger.debug('Raw response content:', response);

      if (!response) {
        this.logger.error('Empty response received from AI model');
        throw new Error('Empty response from AI model');
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response);
        this.logger.debug('Successfully parsed JSON response:', parsedResponse);
      } catch (parseError) {
        this.logger.error('Failed to parse AI response as JSON:', parseError);
        this.logger.error('Raw response that failed to parse:', response);
        throw new Error('Invalid JSON response from AI model');
      }
      
      // Log the parsed response structure
      this.logger.debug('Parsed response structure:', {
        hasTitle: !!parsedResponse.title,
        hasColumns: Array.isArray(parsedResponse.columns),
        columnsCount: parsedResponse.columns?.length,
        hasRows: Array.isArray(parsedResponse.rows),
        rowsCount: parsedResponse.rows?.length,
        hasActions: Array.isArray(parsedResponse.actions),
        actionsCount: parsedResponse.actions?.length
      });
      
      // Standardize actions with proper types and labels
      const standardActions = (parsedResponse.actions || []).map((action: any) => ({
        type: action.type || 'default',
        label: action.label || 'Action',
        icon: action.icon
      }));

      // Add default actions if none were provided
      if (standardActions.length === 0) {
        standardActions.push(
          { type: 'view', label: 'View', icon: 'view' },
          { type: 'edit', label: 'Edit', icon: 'edit' },
          { type: 'delete', label: 'Delete', icon: 'delete' }
        );
      }
      
      // Map the response to match the frontend's expected format
      const tableData: TableData = {
        title: parsedResponse.title || "Generated Table",
        columns: parsedResponse.columns || [],
        rows: parsedResponse.rows || [],
        actions: standardActions
      };
      
      // Remove any actions from individual rows to prevent duplicate action buttons
      tableData.rows = tableData.rows.map((item, index) => {
        // Ensure ID exists
        if (!item.id) {
          item.id = `generated-${index + 1}`;
        }
        
        // Remove any 'actions' property from rows that might cause duplication
        if (item.actions) {
          const { actions, ...rowWithoutActions } = item;
          return rowWithoutActions;
        }
        
        return item;
      });
      
      this.logger.debug('Mapped table data:', {
        title: tableData.title,
        columnsCount: tableData.columns.length,
        rowsCount: tableData.rows.length,
        actionsCount: tableData.actions.length
      });
      
      this.logger.log(`Successfully generated table with ${tableData.rows.length} rows`);
      return tableData;
    } catch (error) {
      this.logger.error('Error during table generation:', error);
      this.logger.error('Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Get available action handlers with their configurations
   */
  async getActionHandlers() {
    this.logger.log('Getting action handlers');
    
    // In a real app, this would likely come from a database or configuration
    // For now, we'll return static handler definitions
    return [
      {
        type: 'save',
        config: {
          enabled: true,
          permissions: ['basic:write'],
          settings: {
            confirmBeforeSave: true,
            notifyOnSave: true,
          },
          endpoints: {
            base: '/api',
          }
        },
        // Optional: We could provide code for dynamic handlers
        // This would be a string representing the handler class implementation
        // Code would normally be encrypted in a real application
        code: `
          class DynamicSaveHandler {
            constructor(type, config) {
              this.type = type;
              this.config = config;
              this.metadata = {
                type: type,
                name: 'Dynamic Save Handler',
                description: 'Dynamically created save handler',
                version: '1.0.0'
              };
            }
            
            async execute(rowData, context) {
              console.log('Dynamic handler executing for:', rowData);
              
              // Determine what type of data we're dealing with
              const dataType = this.analyzeDataType(rowData);
              
              // Return a context-aware response
              return {
                success: true,
                message: \`Item \${rowData.id} saved as \${dataType}\`,
                data: {
                  id: rowData.id,
                  timestamp: new Date().toISOString(),
                  dataType
                }
              };
            }
            
            getMetadata() {
              return this.metadata;
            }
            
            updateConfig(config) {
              this.config = {...this.config, ...config};
            }
            
            analyzeDataType(data) {
              if (data.amount) return 'expense';
              if (data.fileName) return 'document';
              if (data.dueDate) return 'task';
              return 'unknown';
            }
          }
        `
      },
      {
        type: 'delete',
        config: {
          enabled: true,
          permissions: ['admin:delete'],
          settings: {
            confirmBeforeDelete: true,
            softDelete: false,
          },
          endpoints: {
            base: '/api',
          }
        },
        // Example of providing "encrypted" code for the delete handler
        code: `ENCRYPTED:
          class DynamicDeleteHandler {
            constructor(type, config) {
              this.type = type;
              this.config = config;
              this.metadata = {
                type: type,
                name: 'Dynamic Delete Handler',
                description: 'Dynamically created delete handler',
                version: '1.0.0'
              };
            }
            
            async execute(rowData, context) {
              console.log('Dynamic DELETE handler executing for:', rowData);
              
              // Simulate backend call for deletion
              await new Promise(resolve => setTimeout(resolve, 800));
              
              // For demonstration purposes only
              if (rowData.id.includes('3')) {
                return {
                  success: false,
                  message: 'Cannot delete this item due to dependencies'
                };
              }
              
              return {
                success: true,
                message: 'Item successfully deleted',
                data: {
                  id: rowData.id,
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
        `
      },
      {
        type: 'view',
        config: {
          enabled: true,
          permissions: ['basic:read'],
          settings: {
            openInModal: true,
          },
          endpoints: {
            base: '/api',
          }
        }
      },
      {
        type: 'export',
        config: {
          enabled: true,
          permissions: ['data:export'],
          settings: {
            formats: ['csv', 'pdf', 'excel'],
            includeHeaders: true
          },
          endpoints: {
            base: '/api/export',
          }
        }
      }
    ];
  }

  private getSystemPrompt(): string {
    return `You are a helpful assistant that generates structured table data in JSON format. 
    The response should be a valid JSON object with the following structure:
    {
      "title": "string (table title)",
      "columns": [
        {
          "key": "string (column identifier)",
          "label": "string (column display name)"
        }
      ],
      "rows": [
        {
          "id": "string (unique identifier)",
          ...other properties matching column keys
        }
      ],
      "actions": [
        {
          "type": "string (action type)",
          "label": "string (action display name)",
          "icon": "string (optional icon name)"
        }
      ]
    }
    
    IMPORTANT: Actions should ONLY be defined at the root level in the "actions" array. Do NOT include actions within individual rows.
    
    Each row should have an id and properties matching the column keys.
    Make sure to include all the data in the response, including columns, rows, and actions.
    The response must be a valid JSON object with all required fields.
    
    For actions, use the following standard types when appropriate:
    - "view": For viewing item details
    - "edit": For editing items
    - "delete": For deleting items
    - "save": For saving or bookmarking items
    - "export": For exporting items
    
    If appropriate, you can use more specific action types based on the context.`;
  }
} 
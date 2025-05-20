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
      
      // Ensure required actions based on column count
      const columnCount = parsedResponse.columns?.length || 0;
      const standardActions: Array<{type: string, label: string, icon?: string}> = [];
      
      // Always add edit and delete actions
      standardActions.push(
        { type: 'edit', label: 'Edit', icon: 'edit' },
        { type: 'delete', label: 'Delete', icon: 'delete' }
      );
      
      // Add view action only if 4+ columns
      if (columnCount >= 4) {
        standardActions.push({ type: 'view', label: 'View', icon: 'view' });
      }
      
      // Map the response to match the frontend's expected format
      const tableData: TableData = {
        key: parsedResponse.key || this.generateTableKey(parsedResponse.title || "Generated Table"),
        title: parsedResponse.title || "Generated Table",
        columns: parsedResponse.columns || [],
        rows: parsedResponse.rows || [],
        actions: standardActions
      };
      
      // Process rows to ensure IDs and icons
      tableData.rows = tableData.rows.map((item, index) => {
        // Ensure ID exists
        if (!item.id) {
          item.id = `generated-${index + 1}`;
        }
        
        // Ensure icon exists - if missing, choose based on index
        if (!item.icon || typeof item.icon !== 'string') {
          const availableIcons = [
            'bookmark', 'chat', 'menu', 'dns', 'inbox', 'account_balance', 
            'analytics', 'draft', 'chart', 'file', 'calendar', 'person', 
            'settings', 'star', 'mail', 'lock', 'globe', 'share'
          ];
          // Pick icon based on index to ensure variety
          item.icon = availableIcons[index % availableIcons.length];
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
      "key": "string (unique identifier for the table, lowercase with underscores)",
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
          "icon": "string (one of the permitted icon names listed below)",
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
    
    IMPORTANT RULES:
    
    1. You MUST include a "key" property for the table. This should:
       - Be a unique identifier derived from the table title
       - Only contain lowercase letters, numbers, and underscores
       - Be short but descriptive (e.g., "expense_tracker", "sales_data", "project_tasks")
    
    2. For actions, you MUST ONLY include these action types:
       - "edit": Always include this action for editing items
       - "delete": Always include this action for deleting items
       - "view": ONLY include this if the table has 4 or more columns
    
    3. Actions should ONLY be defined at the root level in the "actions" array. Do NOT include actions within individual rows.
    
    4. Each row MUST have an "icon" property that is one of these permitted values:
       - "bookmark", "chat", "menu", "dns", "inbox", "account_balance", "analytics"
       - "draft", "chart", "file", "calendar", "person", "settings", "star"
       - "mail", "lock", "globe", "share"
       
    5. Choose an appropriate icon for each row based on its content and context.
    
    6. Each row should have an id and properties matching the column keys.
    
    Make sure to include all the data in the response, including key, columns, rows with icons, and the specified actions.
    The response must be a valid JSON object with all required fields.`;
  }

  async editTable(prompt: string, existingTable: TableData): Promise<TableData> {
    this.logger.log(`Starting table edit for prompt: "${prompt}"`);
    this.logger.debug(`Existing table: ${existingTable.title} with ${existingTable.columns.length} columns and ${existingTable.rows.length} rows`);
    
    const model = this.configService.get<string>('AI_MODEL_NAME', 'neurospaicy');
    const maxTokens = parseInt(this.configService.get<string>('AI_MAX_TOKENS', '1000'), 1000);
    
    // Convert existing table to a string representation for the prompt
    const existingTableString = JSON.stringify(existingTable, null, 2);
    
    try {
      this.logger.log('Sending edit request to AI model...');
      const completion = await this.openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content: this.getTableEditSystemPrompt()
          },
          {
            role: "user",
            content: `I want to modify this existing table:
${existingTableString}

Please make the following changes: ${prompt}

Return the modified table in JSON format.`
          }
        ],
        max_tokens: maxTokens,
        response_format: { type: "json_object" }
      });

      this.logger.log('Received response from AI model for table edit');
      
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
      
      // Process the response the same way as generateTable
      // Ensure required actions based on column count
      const columnCount = parsedResponse.columns?.length || 0;
      const standardActions: Array<{type: string, label: string, icon?: string}> = [];
      
      // Always add edit and delete actions
      standardActions.push(
        { type: 'edit', label: 'Edit', icon: 'edit' },
        { type: 'delete', label: 'Delete', icon: 'delete' }
      );
      
      // Add view action only if 4+ columns
      if (columnCount >= 4) {
        standardActions.push({ type: 'view', label: 'View', icon: 'view' });
      }
      
      // Map the response to match the frontend's expected format
      const tableData: TableData = {
        key: parsedResponse.key || existingTable.key || this.generateTableKey(parsedResponse.title || existingTable.title),
        title: parsedResponse.title || existingTable.title,
        columns: parsedResponse.columns || existingTable.columns,
        rows: parsedResponse.rows || existingTable.rows,
        actions: standardActions
      };
      
      // Process rows to ensure IDs and remove duplicate actions
      tableData.rows = tableData.rows.map((item, index) => {
        // Ensure ID exists, preserve existing IDs when possible
        if (!item.id) {
          // Try to match with an existing row to preserve ID
          const existingRow = existingTable.rows.find(row => {
            // Match based on first column value if it exists
            const firstColumnKey = tableData.columns[0]?.key;
            return firstColumnKey && row[firstColumnKey] === item[firstColumnKey];
          });
          
          if (existingRow) {
            item.id = existingRow.id;
          } else {
            item.id = `generated-${index + 1}`;
          }
        }
        
        // Ensure icon exists - if missing, choose based on index or preserve from existing row
        if (!item.icon || typeof item.icon !== 'string') {
          // Try to find matching existing row to preserve its icon
          const existingRow = existingTable.rows.find(row => row.id === item.id);
          
          if (existingRow && existingRow.icon) {
            item.icon = existingRow.icon;
          } else {
            // Otherwise choose from available icons
            const availableIcons = [
              'bookmark', 'chat', 'menu', 'dns', 'inbox', 'account_balance', 
              'analytics', 'draft', 'chart', 'file', 'calendar', 'person', 
              'settings', 'star', 'mail', 'lock', 'globe', 'share'
            ];
            // Pick icon based on index to ensure variety
            item.icon = availableIcons[index % availableIcons.length];
          }
        }
        
        // Remove any 'actions' property from rows
        if (item.actions) {
          const { actions, ...rowWithoutActions } = item;
          return rowWithoutActions;
        }
        
        return item;
      });
      
      this.logger.debug('Mapped edited table data:', {
        title: tableData.title,
        columnsCount: tableData.columns.length,
        rowsCount: tableData.rows.length,
        actionsCount: tableData.actions.length
      });
      
      this.logger.log(`Successfully edited table with ${tableData.rows.length} rows`);
      return tableData;
    } catch (error) {
      this.logger.error('Error during table editing:', error);
      this.logger.error('Error stack:', error.stack);
      throw error;
    }
  }

  private getTableEditSystemPrompt(): string {
    return `You are a helpful assistant that modifies structured table data in JSON format.
    You will be given an existing table in JSON format, and your task is to modify it according to user instructions.
    
    The table has the following structure:
    {
      "key": "string (unique identifier for the table, lowercase with underscores)",
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
          "icon": "string (one of the permitted icon names listed below)",
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
    
    IMPORTANT RULES:
    
    1. Maintain the original structure of the table.
    
    2. Make ONLY the changes requested by the user, preserving all other data.
    
    3. You MUST preserve the original "key" property of the table. DO NOT change this value.
    
    4. For actions, you MUST ONLY include these action types:
       - "edit": Always include this action for editing items
       - "delete": Always include this action for deleting items
       - "view": ONLY include this if the table has 4 or more columns
    
    5. Each row MUST have an "icon" property that is one of these permitted values:
       - "bookmark", "chat", "menu", "dns", "inbox", "account_balance", "analytics"
       - "draft", "chart", "file", "calendar", "person", "settings", "star"
       - "mail", "lock", "globe", "share"
    
    6. If adding new rows, ensure each new row has an appropriate icon selected from the permitted list.
    
    7. Actions should ONLY be defined at the root level in the "actions" array, not within individual rows.
    
    8. Preserve existing row IDs whenever possible.
    
    9. Your response must be a complete, valid JSON object containing the entire modified table.`;
  }

  private generateTableKey(title: string): string {
    // Generate a clean key from the title
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '_')     // Replace spaces with underscores
      .replace(/-+/g, '_')      // Replace hyphens with underscores
      .substring(0, 30)         // Limit length
      + '_' + Math.floor(Date.now() / 1000).toString().substring(6); // Add timestamp suffix for uniqueness
  }
} 
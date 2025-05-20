import { Controller, Post, Get, Body, Logger } from '@nestjs/common';
import { TableService } from './table.service';
import { TableData, EditTableDto } from './interfaces/table.interface';

@Controller('table')
export class TableController {
  private readonly logger = new Logger(TableController.name);

  constructor(private readonly tableService: TableService) {}

  @Post('generate')
  async generateTable(@Body('prompt') prompt: string, @Body('existingTable') existingTable?: TableData): Promise<TableData> {
    if (existingTable) {
      // If existingTable is provided, this is an edit operation
      this.logger.log(`Received table edit request for "${existingTable.title}" with prompt: ${prompt}`);
      return this.editTable({ prompt, existingTable });
    }
    
    // Otherwise, treat as a normal generation request
    this.logger.log(`Received table generation request with prompt: ${prompt}`);
    
    if (!prompt) {
      this.logger.error('No prompt provided in request body');
      throw new Error('Prompt is required');
    }

    try {
      const tableData = await this.tableService.generateTable(prompt);
      this.logger.log('Successfully generated table data');
      return tableData;
    } catch (error) {
      this.logger.error('Failed to generate table:', error);
      throw error;
    }
  }

  // Private method to handle table editing
  private async editTable(editTableDto: EditTableDto): Promise<TableData> {
    const { prompt, existingTable } = editTableDto;
    
    if (!prompt) {
      this.logger.error('No prompt provided for table edit');
      throw new Error('Prompt is required for editing');
    }

    if (!existingTable) {
      this.logger.error('No existing table provided for edit operation');
      throw new Error('Existing table data is required for editing');
    }

    try {
      const tableData = await this.tableService.editTable(prompt, existingTable);
      this.logger.log(`Successfully edited table: ${existingTable.title}`);
      return tableData;
    } catch (error) {
      this.logger.error('Failed to edit table:', error);
      throw error;
    }
  }

  @Get('action-handlers')
  async getActionHandlers() {
    this.logger.log('Received request for action handlers');
    
    try {
      const actionHandlers = await this.tableService.getActionHandlers();
      this.logger.log('Successfully retrieved action handlers');
      return actionHandlers;
    } catch (error) {
      this.logger.error('Failed to get action handlers:', error);
      throw error;
    }
  }
} 
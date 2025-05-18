import { Controller, Post, Get, Body, Logger } from '@nestjs/common';
import { TableService } from './table.service';
import { TableData } from './interfaces/table.interface';

@Controller('table')
export class TableController {
  private readonly logger = new Logger(TableController.name);

  constructor(private readonly tableService: TableService) {}

  @Post('generate')
  async generateTable(@Body('prompt') prompt: string): Promise<TableData> {
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
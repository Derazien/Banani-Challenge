import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  Logger
} from '@nestjs/common';
import { ActionHandlerService } from '../services/action-handler.service';
import { ActionHandlerDto } from '../entities/action-handler.entity';

/**
 * REST API controller for action handlers
 * Note: GraphQL API is also available at /graphql
 */
@Controller('api/action-handlers')
export class ActionHandlerController {
  private readonly logger = new Logger(ActionHandlerController.name);

  constructor(private readonly actionHandlerService: ActionHandlerService) {}

  /**
   * Get all handlers or filter by type
   * GraphQL equivalent: query { actionHandlers(type: "view") { ... } }
   */
  @Get()
  async findAll(@Query('type') type?: string) {
    this.logger.log(`Finding all action handlers${type ? ` of type: ${type}` : ''}`);
    return this.actionHandlerService.findAll(type);
  }

  /**
   * Get the latest version of a handler by type
   * GraphQL equivalent: query { actionHandler(type: "view") { ... } }
   */
  @Get('latest')
  async findLatest(@Query('type') type: string) {
    this.logger.log(`Finding latest version of handler type: ${type}`);
    // Use the decrypted version for client consumption
    return this.actionHandlerService.getHandlerWithDecryptedCode(type);
  }

  /**
   * Create a new handler
   * GraphQL equivalent: mutation { createActionHandler(input: {...}) { ... } }
   */
  @Post()
  async create(@Body() createHandlerDto: ActionHandlerDto) {
    this.logger.log(`Creating new handler of type: ${createHandlerDto.type}`);
    return this.actionHandlerService.create(createHandlerDto);
  }

  /**
   * Update an existing handler
   * GraphQL equivalent: mutation { updateActionHandler(type: "view", version: "1.0.0", input: {...}) { ... } }
   */
  @Put(':type/:version')
  async update(
    @Param('type') type: string,
    @Param('version') version: string,
    @Body() updateHandlerDto: Partial<ActionHandlerDto>
  ) {
    this.logger.log(`Updating handler ${type} v${version}`);
    return this.actionHandlerService.update(type, version, updateHandlerDto);
  }

  /**
   * Create a new version of a handler
   * GraphQL equivalent: mutation { createHandlerVersion(type: "view", input: {...}, changeType: "minor") { ... } }
   */
  @Post(':type/versions')
  async createNewVersion(
    @Param('type') type: string,
    @Body() handlerDto: Partial<ActionHandlerDto>,
    @Query('changeType') changeType?: 'major' | 'minor' | 'patch'
  ) {
    this.logger.log(`Creating new version of handler ${type} (change type: ${changeType || 'patch'})`);
    return this.actionHandlerService.createNewVersion(type, handlerDto, changeType);
  }

  /**
   * Delete a handler
   * GraphQL equivalent: mutation { removeActionHandler(type: "view", version: "1.0.0") }
   */
  @Delete(':type/:version')
  async remove(
    @Param('type') type: string,
    @Param('version') version: string
  ) {
    this.logger.log(`Removing handler ${type} v${version}`);
    return this.actionHandlerService.remove(type, version);
  }

  /**
   * Initialize default handlers - REST API only, no GraphQL equivalent
   */
  @Post('initialize')
  async initializeDefaults() {
    this.logger.log('Initializing default handlers');
    await this.actionHandlerService.initializeDefaultHandlers();
    return { message: 'Default handlers initialized' };
  }

  /**
   * Check for handler updates - REST API only, no GraphQL equivalent 
   */
  @Get('check-updates')
  async checkForUpdates(
    @Query('type') type: string,
    @Query('frontendVersion') frontendVersion: string
  ) {
    this.logger.log(`Checking updates for ${type} against frontend version ${frontendVersion}`);
    const needsUpdate = await this.actionHandlerService.checkForUpdates(type, frontendVersion);
    return { needsUpdate };
  }
} 
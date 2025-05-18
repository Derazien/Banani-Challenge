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
import { ActionHandlerDto } from '../schemas/action-handler.schema';

@Controller('api/action-handlers')
export class ActionHandlerController {
  private readonly logger = new Logger(ActionHandlerController.name);

  constructor(private readonly actionHandlerService: ActionHandlerService) {}

  @Get()
  async findAll(@Query('type') type?: string) {
    this.logger.log(`Finding all action handlers${type ? ` of type: ${type}` : ''}`);
    return this.actionHandlerService.findAll(type);
  }

  @Get('latest')
  async findLatest(@Query('type') type: string) {
    this.logger.log(`Finding latest version of handler type: ${type}`);
    return this.actionHandlerService.findLatestByType(type);
  }

  @Post()
  async create(@Body() createHandlerDto: ActionHandlerDto) {
    this.logger.log(`Creating new handler of type: ${createHandlerDto.type}`);
    return this.actionHandlerService.create(createHandlerDto);
  }

  @Put(':type/:version')
  async update(
    @Param('type') type: string,
    @Param('version') version: string,
    @Body() updateHandlerDto: Partial<ActionHandlerDto>
  ) {
    this.logger.log(`Updating handler ${type} v${version}`);
    return this.actionHandlerService.update(type, version, updateHandlerDto);
  }

  @Delete(':type/:version')
  async remove(
    @Param('type') type: string,
    @Param('version') version: string
  ) {
    this.logger.log(`Removing handler ${type} v${version}`);
    return this.actionHandlerService.remove(type, version);
  }

  @Post('initialize')
  async initializeDefaults() {
    this.logger.log('Initializing default handlers');
    await this.actionHandlerService.initializeDefaultHandlers();
    return { message: 'Default handlers initialized' };
  }

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
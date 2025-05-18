import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ActionHandler, ActionHandlerDto } from '../schemas/action-handler.schema';
import * as semver from 'semver';

@Injectable()
export class ActionHandlerService {
  private readonly logger = new Logger(ActionHandlerService.name);

  constructor(
    @InjectModel(ActionHandler.name) private actionHandlerModel: Model<ActionHandler>
  ) {}

  /**
   * Get all action handlers, optionally filtered by type
   */
  async findAll(type?: string): Promise<ActionHandler[]> {
    if (type) {
      return this.actionHandlerModel.find({ type }).exec();
    }
    return this.actionHandlerModel.find().exec();
  }

  /**
   * Get latest version of a specific handler type
   */
  async findLatestByType(type: string): Promise<ActionHandler | null> {
    // Find all versions of this handler type
    const handlers = await this.actionHandlerModel.find({ type }).exec();
    
    if (!handlers || handlers.length === 0) {
      return null;
    }
    
    // Sort by semantic version and return the latest
    return handlers.sort((a, b) => {
      return semver.compare(b.version, a.version);
    })[0];
  }

  /**
   * Create a new action handler
   */
  async create(createHandlerDto: ActionHandlerDto): Promise<ActionHandler> {
    const createdHandler = new this.actionHandlerModel(createHandlerDto);
    return createdHandler.save();
  }

  /**
   * Update an existing action handler by type and version
   */
  async update(type: string, version: string, updateHandlerDto: Partial<ActionHandlerDto>): Promise<ActionHandler | null> {
    return this.actionHandlerModel.findOneAndUpdate(
      { type, version },
      updateHandlerDto,
      { new: true }
    ).exec();
  }

  /**
   * Delete an action handler
   */
  async remove(type: string, version: string): Promise<any> {
    return this.actionHandlerModel.deleteOne({ type, version }).exec();
  }

  /**
   * Check if a handler needs to be updated based on frontend version
   */
  async checkForUpdates(type: string, frontendVersion: string): Promise<boolean> {
    const handler = await this.findLatestByType(type);
    
    if (!handler || !handler.frontendVersion) {
      return true; // No handler or no frontend version means update needed
    }
    
    // Compare versions to see if update is needed
    return semver.gt(frontendVersion, handler.frontendVersion);
  }

  /**
   * Initialize default handlers if none exist
   */
  async initializeDefaultHandlers(): Promise<void> {
    const types = ['view', 'edit', 'delete', 'save'];
    const defaultVersion = '1.0.0';
    const frontendVersion = '1.0.0';
    
    for (const type of types) {
      const existingHandler = await this.findLatestByType(type);
      
      if (!existingHandler) {
        this.logger.log(`Creating default handler for type: ${type}`);
        
        await this.create({
          type,
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} Handler`,
          description: `Default ${type} handler for table actions`,
          version: defaultVersion,
          frontendVersion,
          enabled: true,
          settings: {},
          icon: type
        });
      }
    }
  }
} 
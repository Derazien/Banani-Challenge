import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActionHandler, ActionHandlerDto } from '../entities/action-handler.entity';
import * as semver from 'semver';
import { VersionControlUtil } from '../utils/version-control';

@Injectable()
export class ActionHandlerService {
  private readonly logger = new Logger(ActionHandlerService.name);

  constructor(
    @InjectRepository(ActionHandler)
    private actionHandlerRepository: Repository<ActionHandler>,
    private versionControlUtil: VersionControlUtil
  ) {}

  /**
   * Get all action handlers, optionally filtered by type
   */
  async findAll(type?: string): Promise<ActionHandler[]> {
    if (type) {
      return this.actionHandlerRepository.find({ where: { type } });
    }
    return this.actionHandlerRepository.find();
  }

  /**
   * Get latest version of a specific handler type
   */
  async findLatestByType(type: string): Promise<ActionHandler | null> {
    // Find all versions of this handler type
    const handlers = await this.actionHandlerRepository.find({ 
      where: { type },
      order: { version: 'DESC' }
    });
    
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
    // Encrypt code if provided
    if (createHandlerDto.code) {
      createHandlerDto.code = this.versionControlUtil.encryptCode(createHandlerDto.code);
    }
    
    const handler = this.actionHandlerRepository.create(createHandlerDto);
    return this.actionHandlerRepository.save(handler);
  }

  /**
   * Update an existing action handler by type and version
   */
  async update(type: string, version: string, updateHandlerDto: Partial<ActionHandlerDto>): Promise<ActionHandler | null> {
    const handler = await this.actionHandlerRepository.findOne({ 
      where: { type, version } 
    });
    
    if (!handler) {
      return null;
    }
    
    // Encrypt code if provided
    if (updateHandlerDto.code) {
      updateHandlerDto.code = this.versionControlUtil.encryptCode(updateHandlerDto.code);
    }
    
    // Update the handler properties
    Object.assign(handler, updateHandlerDto);
    
    // Save the updated handler
    return this.actionHandlerRepository.save(handler);
  }

  /**
   * Get a handler with decrypted code for client use
   */
  async getHandlerWithDecryptedCode(type: string, version?: string): Promise<ActionHandler | null> {
    let handler: ActionHandler | null;
    
    if (version) {
      // Find specific version
      const handlers = await this.findAll(type);
      handler = handlers.find(h => h.version === version) || null;
    } else {
      // Find latest version
      handler = await this.findLatestByType(type);
    }
    
    if (handler && handler.code) {
      // Create a copy with decrypted code
      const handlerCopy = { ...handler };
      handlerCopy.code = this.versionControlUtil.decryptCode(handler.code);
      return handlerCopy;
    }
    
    return handler;
  }

  /**
   * Delete an action handler
   */
  async remove(type: string, version: string): Promise<any> {
    const handler = await this.actionHandlerRepository.findOne({ 
      where: { type, version } 
    });
    
    if (!handler) {
      return { affected: 0 };
    }
    
    return this.actionHandlerRepository.remove(handler);
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
    return this.versionControlUtil.isUpdateNeeded(frontendVersion, handler.frontendVersion);
  }

  /**
   * Create a new version of a handler
   */
  async createNewVersion(type: string, handlerDto: Partial<ActionHandlerDto>, changeType: 'major' | 'minor' | 'patch' = 'patch'): Promise<ActionHandler> {
    // Get the current latest version
    const currentHandler = await this.findLatestByType(type);
    
    if (!currentHandler) {
      // If no existing handler, create with version 1.0.0
      return this.create({
        ...handlerDto,
        type,
        version: '1.0.0'
      } as ActionHandlerDto);
    }
    
    // Generate new version number
    const newVersion = this.versionControlUtil.generateNewVersion(currentHandler.version, changeType);
    
    // Create new handler version
    return this.create({
      ...currentHandler,
      ...handlerDto,
      version: newVersion,
      id: undefined // Make sure we don't copy the ID
    } as ActionHandlerDto);
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
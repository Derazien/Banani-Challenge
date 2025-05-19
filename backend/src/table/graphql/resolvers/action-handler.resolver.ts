import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ActionHandlerService } from '../../services/action-handler.service';
import { ActionHandlerType } from '../types/action-handler.type';
import { ActionHandlerInput } from '../inputs/action-handler.input';
import { NotFoundException } from '@nestjs/common';

@Resolver(() => ActionHandlerType)
export class ActionHandlerResolver {
  constructor(private readonly actionHandlerService: ActionHandlerService) {}

  @Query(() => [ActionHandlerType])
  async actionHandlers(@Args('type', { nullable: true }) type?: string): Promise<ActionHandlerType[]> {
    return this.actionHandlerService.findAll(type);
  }

  @Query(() => ActionHandlerType)
  async actionHandler(
    @Args('type') type: string,
    @Args('version', { nullable: true }) version?: string
  ): Promise<ActionHandlerType> {
    // Get handler with decrypted code for client use
    const handler = await this.actionHandlerService.getHandlerWithDecryptedCode(type, version);
    
    if (!handler) {
      throw new NotFoundException(`Handler with type ${type}${version ? ` and version ${version}` : ''} not found`);
    }
    
    return handler;
  }

  @Mutation(() => ActionHandlerType)
  async createActionHandler(
    @Args('input') input: ActionHandlerInput
  ): Promise<ActionHandlerType> {
    // Handle encryption option
    const { encryptCode, ...handlerData } = input;
    
    // Encryption is handled internally in the service
    return this.actionHandlerService.create(handlerData);
  }

  @Mutation(() => ActionHandlerType)
  async updateActionHandler(
    @Args('type') type: string,
    @Args('version') version: string,
    @Args('input') input: ActionHandlerInput
  ): Promise<ActionHandlerType> {
    // Handle encryption option
    const { encryptCode, ...handlerData } = input;
    
    const updatedHandler = await this.actionHandlerService.update(type, version, handlerData);
    
    if (!updatedHandler) {
      throw new NotFoundException(`Handler with type ${type} and version ${version} not found`);
    }
    
    return updatedHandler;
  }

  @Mutation(() => ActionHandlerType)
  async createHandlerVersion(
    @Args('type') type: string,
    @Args('input') input: ActionHandlerInput,
    @Args('changeType', { defaultValue: 'patch' }) changeType: 'major' | 'minor' | 'patch'
  ): Promise<ActionHandlerType> {
    // Handle encryption option
    const { encryptCode, ...handlerData } = input;
    
    return this.actionHandlerService.createNewVersion(type, handlerData, changeType);
  }

  @Mutation(() => Boolean)
  async removeActionHandler(
    @Args('type') type: string,
    @Args('version') version: string
  ): Promise<boolean> {
    const result = await this.actionHandlerService.remove(type, version);
    return !!result;
  }
} 
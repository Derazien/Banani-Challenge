import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Settings for action handlers that can be customized
 */
export class HandlerSettings {
  @Prop({ type: Object, default: {} })
  settings: Record<string, any>;
}

/**
 * Schema for action handlers stored in the database
 */
@Schema({
  timestamps: true,
  collection: 'action_handlers'
})
export class ActionHandler extends Document {
  @Prop({ required: true, unique: true })
  type: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  version: string;

  @Prop({ default: true })
  enabled: boolean;

  @Prop({ type: HandlerSettings })
  settings: HandlerSettings;

  @Prop()
  icon?: string;

  @Prop()
  code?: string;

  @Prop()
  frontendVersion?: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ActionHandlerSchema = SchemaFactory.createForClass(ActionHandler);

/**
 * Data transfer object for creating/updating action handlers
 */
export class ActionHandlerDto {
  type: string;
  name: string;
  description?: string;
  version: string;
  enabled?: boolean;
  settings?: Record<string, any>;
  icon?: string;
  code?: string;
  frontendVersion?: string;
} 
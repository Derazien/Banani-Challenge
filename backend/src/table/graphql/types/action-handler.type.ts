import { Field, ObjectType, ID } from '@nestjs/graphql';

@ObjectType()
export class ActionHandlerSettings {
  @Field(() => String, { nullable: true })
  openInModal?: boolean;

  @Field(() => Boolean, { nullable: true })
  confirmBeforeDelete?: boolean;

  @Field(() => Boolean, { nullable: true })
  validateOnEdit?: boolean;

  @Field(() => Boolean, { nullable: true })
  notifyOnSave?: boolean;
}

@ObjectType()
export class ActionHandlerType {
  @Field(() => ID)
  id: string;

  @Field()
  type: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  version: string;

  @Field()
  enabled: boolean;

  @Field(() => ActionHandlerSettings, { nullable: true })
  settings?: ActionHandlerSettings;

  @Field({ nullable: true })
  icon?: string;

  @Field({ nullable: true })
  code?: string;

  @Field({ nullable: true })
  frontendVersion?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
} 
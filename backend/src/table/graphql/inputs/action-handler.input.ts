import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ActionHandlerSettingsInput {
  @Field(() => Boolean, { nullable: true })
  openInModal?: boolean;

  @Field(() => Boolean, { nullable: true })
  confirmBeforeDelete?: boolean;

  @Field(() => Boolean, { nullable: true })
  validateOnEdit?: boolean;

  @Field(() => Boolean, { nullable: true })
  notifyOnSave?: boolean;
}

@InputType()
export class ActionHandlerInput {
  @Field()
  type: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  version: string;

  @Field({ defaultValue: true })
  enabled: boolean;

  @Field(() => ActionHandlerSettingsInput, { nullable: true })
  settings?: ActionHandlerSettingsInput;

  @Field({ nullable: true })
  icon?: string;

  @Field({ nullable: true })
  code?: string;

  @Field({ nullable: true })
  frontendVersion?: string;
  
  @Field({ nullable: true, defaultValue: true })
  encryptCode?: boolean;
} 
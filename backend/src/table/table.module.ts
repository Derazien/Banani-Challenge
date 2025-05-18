import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TableController } from './table.controller';
import { TableService } from './table.service';
import { ActionHandler, ActionHandlerSchema } from './schemas/action-handler.schema';
import { ActionHandlerService } from './services/action-handler.service';
import { ActionHandlerController } from './controllers/action-handler.controller';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: ActionHandler.name, schema: ActionHandlerSchema }
    ])
  ],
  controllers: [TableController, ActionHandlerController],
  providers: [TableService, ActionHandlerService],
  exports: [TableService, ActionHandlerService]
})
export class TableModule {} 
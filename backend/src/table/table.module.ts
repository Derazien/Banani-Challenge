import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TableController } from './table.controller';
import { TableService } from './table.service';
import { ActionHandler } from './entities/action-handler.entity';
import { ActionHandlerService } from './services/action-handler.service';
import { ActionHandlerController } from './controllers/action-handler.controller';
import { DatabaseSeederService } from './services/database-seeder.service';
import { VersionControlUtil } from './utils/version-control';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ActionHandler])
  ],
  controllers: [TableController, ActionHandlerController],
  providers: [
    TableService, 
    ActionHandlerService, 
    DatabaseSeederService,
    VersionControlUtil
  ],
  exports: [TableService, ActionHandlerService]
})
export class TableModule {} 
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TableModule } from './table/table.module';
import { ActionHandler } from './table/entities/action-handler.entity';
import { GraphQLAppModule } from './table/graphql/graphql.module';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: configService.get<string>('DB_PATH', '../data/banani.sqlite'),
        entities: [join(__dirname, '**', '*.entity.{ts,js}')],
        synchronize: configService.get<boolean>('DB_SYNC', true),
        logging: configService.get<boolean>('DB_LOGGING', false),
        autoLoadEntities: true,
      }),
    }),
    TableModule,
    GraphQLAppModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

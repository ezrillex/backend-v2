import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TasksService } from './tasks/tasks.service';
import {ScheduleModule} from "@nestjs/schedule";
import { ShopAdaptersModule } from './shop_adapters/shop-adapters.module';

@Module({
  imports: [ScheduleModule.forRoot(), ShopAdaptersModule],
  controllers: [AppController],
  providers: [AppService, TasksService],
})
export class AppModule {}

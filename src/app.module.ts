import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './tasks/tasks.service';
import { LogService } from './core/log/log.service';
import { NetworkService } from './core/network/network.service';
import { PrismaService } from './core/prisma/prisma.service';
import { UtilsService } from './core/utils/utils.service';
import { ProductsService } from './products/products.service';
import { KpcService } from './shop_adapters/kpc/kpc.service';
import { ZdService } from './shop_adapters/zd/zd.service';
import { SchedulerService } from './scheduler/scheduler.service';
import { HttpModule } from '@nestjs/axios';
import { SearchService } from './search/search.service';
import { ImagesService } from './images/images.service';

@Module({
  imports: [ScheduleModule.forRoot(), HttpModule],
  controllers: [AppController],
  providers: [
    AppService,
    TasksService,
    LogService,
    NetworkService,
    PrismaService,
    UtilsService,
    ProductsService,
    KpcService,
    ZdService,
    SchedulerService,
    SearchService,
    ImagesService,
  ],
})
export class AppModule {}

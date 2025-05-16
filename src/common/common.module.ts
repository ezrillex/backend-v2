import { Module } from '@nestjs/common';
import { LogService } from './log/log.service';
import { NetworkService } from './network/network.service';
import { PrismaService } from './prisma/prisma.service';
import { UtilsService } from './utils/utils.service';
import { HttpModule } from '@nestjs/axios';
import { TasksService } from './tasks/tasks.service';

@Module({
  imports: [HttpModule],
  providers: [
    LogService,
    NetworkService,
    PrismaService,
    UtilsService,
    TasksService,
  ],
  exports: [
    LogService,
    NetworkService,
    PrismaService,
    UtilsService,
    TasksService,
  ],
})
export class CommonModule {}

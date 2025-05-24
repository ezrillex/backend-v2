import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { KpcService } from './shop_adapters/kpc/kpc.service';
import { PrismaService } from './core/prisma/prisma.service';
import { TasksService } from './tasks/tasks.service';
import { SearchService } from './search/search.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly kpc: KpcService,
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
    private readonly searchService: SearchService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('time')
  async testTime() {
    console.log('JS TIME: ', new Date());
    const time = await this.prisma.$queryRaw`SELECT NOW();`;
    console.log('DB TIME: ', time);
  }

  // @Get('debug')
  // async debug() {
  //   const result = await this.kpc.scrape(
  //     {
  //       url: '[REDACTED]',
  //     },
  //     1n,
  //     2n,
  //     1n,
  //     'PRODUCT',
  //   );
  //   await this.tasksService.finishJob(result, 26n);
  // }
  //
  // @Get('debug_page')
  // debugPage() {
  //   return this.kpc.scrape(
  //     {
  //       url: '[REDACTED]',
  //     },
  //     1n,
  //     2n,
  //     1n,
  //     'PAGE',
  //   );
  // }

  @Get('debug_scheduler')
  async testDebugScheduler() {
    await this.tasksService.scheduleDailyTasks();
  }

  @Get('debug_search')
  async testDebugSearch(@Query('query') query: string) {
    // todo sanitization!!!
    return await this.searchService.search(query);
  }
}

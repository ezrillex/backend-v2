import { Controller, Get, Param, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { KpcService } from './shop_adapters/kpc/kpc.service';
import { PrismaService } from './core/prisma/prisma.service';
import { TasksService } from './tasks/tasks.service';
import { SearchService } from './search/search.service';
import { SchedulerService } from './scheduler/scheduler.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly kpc: KpcService,
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
    private readonly searchService: SearchService,
    private readonly schedulerService: SchedulerService,
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

  @Get('debug')
  async debug() {
    await this.schedulerService.createJob(
      'PRODUCT',
      '9ef29768-e8bb-42e0-92d3-06f86801553f',
      {
        url: '[REDACTED]',
      },
    );

    // const result = await this.kpc.scrape(
    //   {
    //     url: '[REDACTED]',
    //   },
    //   'cd402077-3111-42be-a28c-597f4da2faa3',
    //   '3a8e18a2-0a6f-4ad6-a926-c3079ea9c306',
    //   '9ef29768-e8bb-42e0-92d3-06f86801553f',
    //   'PRODUCT',
    // );
    // await this.tasksService.finishJob(
    //   result,
    //   '0196e47c-1e5c-7aa1-9f54-7205e5cbdf26',
    // );
  }
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

  // todo add uuid class validator.
  @Get('debug_producto/:id')
  async testProductSearch(@Param('id') id: string) {
    return this.searchService.getProduct(id);
  }
}

import {
  Controller,
  Get,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AppService } from './app.service';
import { KpcService } from './shop_adapters/kpc/kpc.service';
import { PrismaService } from './core/prisma/prisma.service';
import { TasksService } from './tasks/tasks.service';
import { SearchService } from './search/search.service';
import { SchedulerService } from './scheduler/scheduler.service';
import { Search } from './search/dtos/search/search.dto';
import { GetProduct } from './search/dtos/get-product/get-product';
import { ImagesService } from './images/images.service';
import { GetCategory } from './search/dtos/get-category/get-category';
import { ZdService } from './shop_adapters/zd/zd.service';
import { UtilsService } from './core/utils/utils.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly kpc: KpcService,
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
    private readonly searchService: SearchService,
    private readonly schedulerService: SchedulerService,
    private readonly imagesService: ImagesService,
    private readonly zd: ZdService,
    private readonly utils: UtilsService,
  ) {}

  // @Get('debug')
  // async debug() {
  //   await this.schedulerService.createJob(
  //     'PRODUCT',
  //     '9ef29768-e8bb-42e0-92d3-06f86801553f',
  //     {
  //       url: '[REDACTED]',
  //     },
  //   );
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

  // @Get('debug_scheduler')
  // async testDebugScheduler() {
  //   await this.tasksService.scheduleDailyTasks();
  // }
  //
  // @Get('debug_search')
  // async testDebugSearch(@Query('query') query: string) {
  //   // todo sanitization!!!
  //   return await this.searchService.search(query);
  // }
  //
  // // todo add uuid class validator.
  // @Get('debug_producto/:id')
  // async testProductSearch(@Param('id') id: string) {
  //   return this.searchService.getProduct(id);
  // }

  // @Get('debug_disk')
  // async debug_webdisk() {
  //   return this.tasksService.imageTask();
  // }

  // @Get('debug123')
  // async debug123() {
  //   return this.tasksService.scheduleDailyTasks();
  // }

  // @Get('fix_wrong_hashes')
  // async fixHashes() {
  //   const prods = await this.prisma.products.findMany({
  //     select: {
  //       id: true,
  //       name: true,
  //     },
  //     where: {
  //       tienda: {
  //         adapter: 'KPC',
  //       },
  //     },
  //   });
  //
  //   for (const prod of prods) {
  //     const new_fingerprint = this.utils.hash(prod.name + 'kpc');
  //     await this.prisma.products.update({
  //       data: {
  //         fingerprint: new_fingerprint,
  //       },
  //       where: {
  //         id: prod.id,
  //       },
  //     });
  //   }
  //
  //   return 'finished sucessfully';
  // }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Get('search/:query')
  async search(@Param() params: Search) {
    console.log(params.query);
    return this.searchService.search(params.query);
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Get('product/:id')
  async getProduct(@Param() params: GetProduct) {
    console.log(params.id);
    return this.searchService.getProduct(params.id);
  }

  @Get('categories')
  async getCategories() {
    return this.prisma.categories.findMany({
      select: {
        id: true,
        name: true,
      },
    });
  }

  @Get('categories/:id')
  async getCategory(@Param() params: GetCategory) {
    console.log(params.id);
    return this.searchService.getCategory(params.id);
  }
}

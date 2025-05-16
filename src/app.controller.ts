import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { KpcService } from './shop_adapters/kpc/kpc.service';
import { PrismaService } from './common/prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly kpc: KpcService,
    private readonly prisma: PrismaService,
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
  debug() {
    return this.kpc.scrape({
      url: '[REDACTED]',
      priority: 'PRODUCT',
      category_id: 1,
      tienda_id: 2,
      root_url_id: 1,
    });
  }

  @Get('debug_page')
  debugPage() {
    return this.kpc.scrape({
      url: '[REDACTED]',
      priority: 'PAGE',
      category_id: 1,
      tienda_id: 2,
      root_url_id: 1,
    });
  }
}

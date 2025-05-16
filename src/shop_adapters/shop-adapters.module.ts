import { Module } from '@nestjs/common';
import { KpcService } from './kpc/kpc.service';
import { ZdService } from './zd/zd.service';
import { CommonModule } from '../common/common.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [CommonModule, ProductsModule],
  providers: [KpcService, ZdService],
  exports: [KpcService, ZdService],
})
export class ShopAdaptersModule {}

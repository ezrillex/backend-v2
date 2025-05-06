import { Module } from '@nestjs/common';
import { KpcService } from './kpc/kpc.service';
import { ZdService } from './zd/zd.service';

@Module({
  providers: [KpcService, ZdService]
})
export class ShopAdaptersModule {}

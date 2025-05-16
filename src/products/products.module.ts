import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}

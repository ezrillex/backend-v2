import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { Charset, Encoder, Index } from 'flexsearch';

@Injectable()
export class SearchService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  index: Index<string>;

  async onModuleInit() {
    console.log('indexing start');
    const start = performance.now();

    this.index = new Index<string>({
      tokenize: 'strict',
      encoder: Charset.LatinExtra,
      context: {
        resolution: 5,
        depth: 3,
        bidirectional: true,
      },
    });

    const product_names = await this.prisma.products.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    for (const product of product_names) {
      this.index.add(product.id, product.name);
    }
    console.log(`indexing finished at ${performance.now() - start}ms`);
  }

  async search(query: string) {
    const ids = (await this.index.search({
      query: query,
    })) as string[];

    return this.prisma.products.findMany({
      include: {
        precios: {
          orderBy: {
            created_at: 'desc',
          },
          take: 1, // is this limit?
        },
      },
      where: {
        id: {
          in: ids,
        },
      },
    });
  }
}

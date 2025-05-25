import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { Charset, Index } from 'flexsearch';
import { LogService } from '../core/log/log.service';

@Injectable()
export class SearchService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logs: LogService,
  ) {}

  index: Index<string>;

  async onModuleInit() {
    console.log('indexing start');
    const start = performance.now();

    this.index = new Index<string>({
      tokenize: 'full',
      encoder: Charset.LatinExtra,
      // context: {
      //   resolution: 5,
      //   depth: 3,
      //   bidirectional: true,
      // },
    });

    const product_names = await this.prisma.products.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    for (const product of product_names) {
      await this.index.add(product.id, product.name);
    }
    console.log(`indexing finished at ${performance.now() - start}ms`);
  }

  async search(query: string) {
    const ids = (await this.index.search({
      query,
    })) as string[];

    // todo select solo los campos mostrados en search results.
    const results = await this.prisma.products.findMany({
      include: {
        precios: {
          orderBy: {
            created_at: 'desc',
          },
          take: 1, // is this limit?
        },
        tienda: true,
      },
      where: {
        id: {
          in: ids,
        },
      },
    });

    // analytics
    await this.logs.searchTelemetry(query, results.length);
    return results;
  }

  async getProduct(id: string) {
    const result = await this.prisma.products.findUnique({
      where: { id },
      include: {
        categoria: true,
        imagenes: true,
        precios: {
          orderBy: {
            created_at: 'desc',
          },
          take: 1, // is this limit?
        },
        tienda: true,
      },
    });

    // analytics
    await this.logs.getProductTelemetry(id, !!result);

    if (!result) {
      throw new NotFoundException('Product ID not found');
    } else {
      return result;
    }
  }

  async addNewProductToIndex(id: string, name: string) {
    await this.index.add(id, name);
  }
}

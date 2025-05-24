import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { Charset, Encoder, Index } from 'flexsearch';
import stripAnsi from 'strip-ansi-cjs';
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
      await this.index.add(product.id, product.name);
    }
    console.log(`indexing finished at ${performance.now() - start}ms`);
  }

  async search(query: string) {
    const sanitized_query = stripAnsi(query).trim().slice(0, 150);

    const ids = (await this.index.search({
      query: sanitized_query,
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
    await this.logs.log(
      'search',
      JSON.stringify({
        query: sanitized_query,
        result_count: results.length,
      }),
    );

    return results;
  }

  async getProduct(id: string) {
    return this.prisma.products.findUnique({
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
  }
}

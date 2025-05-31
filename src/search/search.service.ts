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
    const telemetry_start = performance.now();
    const ids = (await this.index.search({
      query,
    })) as string[];

    const results = await this.prisma.products.findMany({
      select: {
        id: true,
        name: true,
        precios: {
          select: {
            value: true,
          },
          orderBy: {
            created_at: 'desc',
          },
          take: 1, // is this limit?
        },
        tienda: {
          select: {
            name: true,
          },
        },
        imagenes: {
          select: {
            id: true,
            bucket: true,
          },
          take: 1,
        },
      },

      where: {
        id: {
          in: ids,
        },
      },
    });

    const telemetry_end = performance.now();
    void this.logs
      .searchTelemetry(query, results.length, telemetry_end - telemetry_start)
      .catch((err) => console.error('log failed', err));

    return results;
  }

  async getCategory(id: string) {
    const telemetry_start = performance.now();

    const results = await this.prisma.categories.findUnique({
      select: {
        name: true,
        productos: {
          // todo reuse this as is same as search query at least this select section.
          select: {
            id: true,
            name: true,
            precios: {
              select: {
                value: true,
              },
              orderBy: {
                created_at: 'desc',
              },
              take: 1, // is this limit?
            },
            tienda: {
              select: {
                name: true,
              },
            },
            imagenes: {
              select: {
                id: true,
                bucket: true,
              },
              take: 1,
            },
          },
        },
      },
      where: {
        id: id,
      },
    });

    const telemetry_end = performance.now();
    void this.logs
      .getCategoryProductsTelemetry(
        id,
        results ? results.productos.length : 0,
        telemetry_end - telemetry_start,
      )
      .catch((err) => console.error('log failed', err));

    if (!results) {
      throw new NotFoundException('Product ID not found');
    } else {
      return results;
    }
  }

  async getProduct(id: string) {
    const telemetry_start = performance.now();
    const result = await this.prisma.products.findUnique({
      where: { id },
      include: {
        categoria: true,
        imagenes: true,
        precios: {
          orderBy: {
            created_at: 'desc',
          },
        },
        tienda: true,
      },
    });

    // analytics
    const telemetry_end = performance.now();
    // move error catch to inside the function.
    void this.logs
      .getProductTelemetry(id, !!result, telemetry_end - telemetry_start)
      .catch((err) => console.error('log failed', err));

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

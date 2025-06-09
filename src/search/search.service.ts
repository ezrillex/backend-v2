import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { Charset, Index, Document, DocumentData } from 'flexsearch';
import { LogService } from '../core/log/log.service';
import * as fuzzysort from 'fuzzysort';

type Product = {
  id: string;
  name: string;
  product_keywords: string;
  category_keywords: string;
};

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
    });

    const product_names = await this.prisma.products.findMany({
      select: {
        id: true,
        name: true,
        keywords: true,
        categoria: {
          select: {
            keywords: true,
          },
        },
      },
    });

    for (const product of product_names) {
      await this.index.add(
        product.id,
        `${product.name} ${product.keywords} ${product.categoria.keywords}`,
      );
    }
    console.log(`indexing finished at ${performance.now() - start}ms`);
  }

  async search(query: string) {
    const telemetry_start = performance.now();
    const telemetry_flexsearch_start = performance.now();
    const ids = (await this.index.search({
      query,
      limit: 1000,
    })) as string[];
    const telemetry_flexsearch = performance.now() - telemetry_flexsearch_start;
    const telemetry_prisma_start = performance.now();
    const results = (
      await this.prisma.products.findMany({
        select: {
          id: true,
          name: true,
          keywords: true,
          categoria: {
            select: {
              keywords: true,
            },
          },
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
      })
    ).map((result) => {
      const categoria_keywords = result.categoria.keywords;
      const precio = result.precios[0]?.value ?? 0;
      delete result.categoria;
      delete result.precios;
      return {
        ...result,
        categoria_keywords,
        precio,
      };
    });
    const telemetry_prisma = performance.now() - telemetry_prisma_start;
    const telemetry_fuzzysort_start = performance.now();
    const keys = ['name', 'keywords', 'categoria_keywords'];
    const boosts = [1, 4, 4]; // more than 1 is worse match score. lower increases match score.
    // 4 = 25% of weight.

    const sorted_results = fuzzysort
      .go(query, results, {
        keys: keys,
        scoreFn: (keysResult) => {
          let score = 0;
          for (let i = 0; i < keysResult.length; i++) {
            score += keysResult[i].score * boosts[i];
          }
          return score;
        },
      })
      .map((result) => this.removeKeywords(result.obj));
    const telemetry_fuzzysort = performance.now() - telemetry_fuzzysort_start;
    const telemetry = performance.now() - telemetry_start;
    void this.logs
      .searchTelemetry(
        query,
        results.length,
        telemetry,
        telemetry_flexsearch,
        telemetry_prisma,
        telemetry_fuzzysort,
      )
      .catch((err) => console.error('log failed', err));
    return sorted_results;
  }

  removeKeywords(obj: any) {
    delete obj.keywords;
    // delete obj.categoria; // creo que ya lo borro alla arriba.
    delete obj.categoria_keywords;
    return obj;
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
    result['precio'] = result.precios[0]?.value ?? 0;

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

import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { Charset, Index, Document, DocumentData } from 'flexsearch';
import { LogService } from '../core/log/log.service';
import * as fuzzysort from 'fuzzysort';
import Prepared = Fuzzysort.Prepared;

type Product = {
  id?: string;
  name: Prepared;
  product_keywords: Prepared;
  category_keywords: Prepared;
};

@Injectable()
export class SearchService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logs: LogService,
  ) {}

  index: Index<string>;

  onMemoryKeywordDictionary: { [key: string]: Product } = {};

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
      this.onMemoryKeywordDictionary[product.id] = {
        name: fuzzysort.prepare(product.name),
        product_keywords: fuzzysort.prepare(product.keywords),
        category_keywords: fuzzysort.prepare(product.categoria.keywords),
      };
    }
    console.log(`indexing finished at ${performance.now() - start}ms`);
  }

  async getProductsKeywords(ids: string[]) {
    const result: Product[] = [];
    for (const id of ids) {
      result.push({
        id: id,
        ...this.onMemoryKeywordDictionary[id],
      });
    }
    return result;
  }

  async search(query: string) {
    const telemetry_start = performance.now();
    const telemetry_flexsearch_start = performance.now();
    const ids = (await this.index.search({
      query,
      limit: 1000,
    })) as string[];
    const telemetry_flexsearch = performance.now() - telemetry_flexsearch_start;

    // todo if we go back to this remove keywords fields.
    // const results = (
    //   await this.prisma.products.findMany({
    //     select: {
    //       id: true,
    //       name: true,
    //       keywords: true,
    //       categoria: {
    //         select: {
    //           keywords: true,
    //         },
    //       },
    //       precios: {
    //         select: {
    //           value: true,
    //         },
    //         orderBy: {
    //           created_at: 'desc',
    //         },
    //         take: 1,
    //       },
    //       tienda: {
    //         select: {
    //           name: true,
    //         },
    //       },
    //       imagenes: {
    //         select: {
    //           id: true,
    //           bucket: true,
    //         },
    //         take: 1,
    //       },
    //     },
    //
    //     where: {
    //       id: {
    //         in: ids,
    //       },
    //     },
    //   })
    // )
    // .map((result) => {
    //   const categoria_keywords = result.categoria.keywords;
    //   const precio = result.precios[0]?.value ?? 0;
    //   delete result.categoria;
    //   delete result.precios;
    //   return {
    //     ...result,
    //     categoria_keywords,
    //     precio,
    //   };
    // });
    const telemetry_fuzzysort_start = performance.now();

    // const telStart = performance.now();
    const results = await this.getProductsKeywords(ids);
    // console.log('got keywords in: ', performance.now() - telStart, 'ms');
    const keys = ['name', 'keywords', 'categoria_keywords'];
    const boosts = [1, 4, 4]; // more than 1 is worse match score. lower increases match score.
    // 4 = 25% of weight.

    const sorted_ids: string[] = fuzzysort
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
      .map((result) => result.obj.id);
    const telemetry_fuzzysort = performance.now() - telemetry_fuzzysort_start;
    const telemetry_prisma_start = performance.now();

    const data: {
      id: string;
      name: string;
      precio: string;
      tienda_name: string;
      imagen_id: string;
      imagen_bucket: string;
    }[] = await this.prisma.$queryRaw`
      SELECT
        p.id,
        p.name,
        pr.value AS precio,
        s.name AS tienda_name,
        i.id AS imagen_id,
        i.bucket AS imagen_bucket
      FROM "Products" p
             LEFT JOIN "Categories" c ON p.categoria_id = c.id
             LEFT JOIN LATERAL (
        SELECT value
        FROM "Prices"
        WHERE producto_id = p.id
        ORDER BY created_at DESC
          LIMIT 1
  ) pr ON true
        LEFT JOIN "Shops" s ON p.tienda_id = s.id
        LEFT JOIN LATERAL (
        SELECT id, bucket
        FROM "Images"
        WHERE producto_id = p.id
        ORDER BY id ASC
        LIMIT 1
        ) i ON true
      WHERE p.id = ANY(${sorted_ids});
    `;

    const telemetry_prisma = performance.now() - telemetry_prisma_start;

    console.log('telemetry_prisma in: ', telemetry_prisma);
    console.log('telemetry_fuzzysort in: ', telemetry_fuzzysort);
    console.log('telemetry_flexsearch in ', telemetry_flexsearch);

    const telemetry = performance.now() - telemetry_start;
    void this.logs
      .searchTelemetry(
        query,
        data.length,
        telemetry,
        telemetry_flexsearch,
        telemetry_prisma,
        telemetry_fuzzysort,
      )
      .catch((err) => console.error('log failed', err));
    return data;
  }

  removeKeywords(obj: any) {
    delete obj.keywords;
    // delete obj.categoria; // creo que ya lo borro alla arriba.
    delete obj.categoria_keywords;
    return obj;
  }

  async getCategory(id: string) {
    const telemetry_start = performance.now();

    const cat_name = await this.prisma.categories.findUnique({
      select: { name: true },
      where: { id: id },
    });

    if (!cat_name) {
      const telemetry_end = performance.now();
      void this.logs
        .getCategoryProductsTelemetry(id, 0, telemetry_end - telemetry_start)
        .catch((err) => console.error('log failed', err));
      throw new NotFoundException('Category ID not found');
    }

    // const results = await this.prisma.categories.findUnique({
    //   select: {
    //     name: true,
    //     productos: {
    //       select: {
    //         id: true,
    //         name: true,
    //         precios: {
    //           select: {
    //             value: true,
    //           },
    //           orderBy: {
    //             created_at: 'desc',
    //           },
    //           take: 1, // is this limit?
    //         },
    //         tienda: {
    //           select: {
    //             name: true,
    //           },
    //         },
    //         imagenes: {
    //           select: {
    //             id: true,
    //             bucket: true,
    //           },
    //           take: 1,
    //         },
    //       },
    //     },
    //   },
    //   where: {
    //     id: id,
    //   },
    // });
    const results: {
      id: string;
      name: string;
      precio: number;
      tienda_name: string;
      imagen_id: string;
      imagen_bucket: number;
    }[] = await this.prisma.$queryRaw`
      SELECT
        p.id AS id,
        p.name AS name,
        pr.value AS precio,
        s.name AS tienda_name,
        i.id AS imagen_id,
        i.bucket AS imagen_bucket
      FROM "Products" p
             LEFT JOIN LATERAL (
        SELECT value
        FROM "Prices"
        WHERE producto_id = p.id
        ORDER BY created_at DESC
          LIMIT 1
  ) pr ON true
        LEFT JOIN "Shops" s ON s.id = p.tienda_id
        LEFT JOIN LATERAL (
        SELECT id, bucket
        FROM "Images"
        WHERE producto_id = p.id
        ORDER BY id ASC
        LIMIT 1
        ) i ON true
      WHERE p.categoria_id = ${id}
    `;

    const telemetry_end = performance.now();
    void this.logs
      .getCategoryProductsTelemetry(
        id,
        results ? results.length : 0,
        telemetry_end - telemetry_start,
      )
      .catch((err) => console.error('log failed', err));

    return {
      category_name: cat_name.name,
      products: results,
    };
  }

  async getProduct(id: string) {
    const telemetry_start = performance.now();
    const result = await this.prisma.products.findUnique({
      where: { id },
      select: {
        name: true,
        marca: true,
        modelo: true,
        details: true,
        url: true,
        last_updated: true,
        // categoria: { // not displayed right now. omitting this for now.
        //   select: {
        //     name: true,
        //   },
        // },
        imagenes: {
          select: {
            id: true,
            bucket: true,
          },
        },
        precios: {
          select: {
            value: true,
            created_at: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        },
        tienda: {
          select: {
            name: true,
          },
        },
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

  async addNewProductToIndex(id: string, name: string, category_id: string) {
    await this.index.add(id, name);
    // todo if cat keywords are updated the index must be updated
    const cat_keywords = await this.prisma.categories.findFirst({
      where: { id: category_id },
      select: { keywords: true },
    });
    // todo on keywords tasks make it so that it updates this.
    this.onMemoryKeywordDictionary[id] = {
      name: fuzzysort.prepare(name),
      product_keywords: fuzzysort.prepare(''),
      category_keywords: fuzzysort.prepare(cat_keywords.keywords),
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { SearchService } from '../search/search.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
  ) {}
  async save_scraped_product_information(
    fingerprint: string,
    nombre: string,
    categoria: string,
    url: string,
    tienda: string,
    imagenes: string[],
    precio: number,
    descripcion: string,
    marca?: string,
  ) {
    // product exists?
    const exists = await this.prisma.products.findFirst({
      where: {
        fingerprint: fingerprint,
      },
      select: {
        id: true,
      },
    });

    const img_urls_objects = imagenes.map((url) => ({
      scraped_url: url,
    }));

    if (exists) {
      // existing record
      console.log('ya existe!');
      await this.prisma.products.update({
        data: {
          url: url,
          details: descripcion,
          marca: marca,
          precios: {
            create: {
              value: precio,
            },
          },
          categoria_id: categoria, // since new categories, update this as well.
          // todo this updates the category but index is not updated to grab these keywords instead.
          imagenes: {
            createMany: {
              data: img_urls_objects,
              skipDuplicates: true,
            },
          },
        },
        where: {
          id: exists.id,
        },
      });
    } else {
      // new record
      const record = await this.prisma.products.create({
        data: {
          fingerprint: fingerprint,
          name: nombre,
          url: url,
          details: descripcion,
          marca: marca,
          precios: {
            create: {
              value: precio,
            },
          },
          imagenes: {
            createMany: {
              data: img_urls_objects,
              skipDuplicates: true,
            },
          },
          categoria: {
            connect: {
              id: categoria,
            },
          },
          tienda: {
            connect: {
              id: tienda,
            },
          },
        },
      });
      // add to index
      await this.searchService.addNewProductToIndex(
        record.id,
        record.name,
        record.categoria_id,
      );
    }
  }
}

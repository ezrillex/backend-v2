import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}
  async save_scraped_product_information(
    fingerprint: string,
    nombre: string,
    categoria: bigint,
    url: string,
    tienda: bigint,
    imagenes: string[],
    precio: number,
    descripcion: string,
    marca?: string,
  ) {
    // product exists?
    const exists = await this.prisma.products.count({
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
        },
        where: {
          id: exists.id,
        },
      });
    } else {
      // new record
      await this.prisma.products.create({
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
    }
  }
}

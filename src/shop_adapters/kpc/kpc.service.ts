import { Injectable } from '@nestjs/common';
import { IshopAdapter } from '../ishop-adapter';
import { NetworkService } from '../../common/network/network.service';
import * as cheerio from 'cheerio';
import { Priority } from '@prisma/client';
import { UtilsService } from '../../common/utils/utils.service';
import { ProductsService } from '../../products/products.service';
import { TasksService } from '../../common/tasks/tasks.service';

@Injectable()
export class KpcService implements IshopAdapter {
  constructor(
    private readonly networkService: NetworkService,
    private readonly utils: UtilsService,
    private readonly productsService: ProductsService,
    private readonly tasksService: TasksService,
  ) {}

  async scrape(job: {
    url: string;
    priority: Priority;
    category_id: number;
    tienda_id: number;
    root_url_id: number;
    page?: number;
  }): Promise<string> {
    let outcome: string;
    if (job.priority === Priority.PAGE || job.priority === Priority.NEXT_PAGE) {
      outcome = await this.handlePage(job.url, job.root_url_id, job.page);
    } else if (job.priority === Priority.PRODUCT) {
      outcome = await this.handleProduct(
        job.url,
        job.category_id,
        job.tienda_id,
      );
    } else {
      // todo fail the job as unkown priority / not set.
      outcome = 'priority-switch-failure';
    }

    // update the job w/ outcome.
    return outcome;
  }
  async handlePage(url: string, root_url_id: number, page?: number) {
    const { status, data } = await this.networkService.get(url);

    // todo validacion de pagina no vacia

    //console.log(status, data);
    const $ = cheerio.load(data);
    const articles = $('article').toArray();
    const product_urls = [];
    for (const article of articles) {
      //const product_name = $(article).find('h2').text().trim();
      // const product_image = $(article)
      //   .find('img')
      //   .attr('data-full-size-image-url');
      const product_url = $(article).find('h2 a').attr('href');
      console.log(product_url);
      // todo validacion que sea un url valido.
      product_urls.push(product_url);
    }
    await this.tasksService.createManyJobs(
      product_urls.map((data) => ({
        job_data: { url: data },
        root_url_id: root_url_id,
        priority: 'PRODUCT',
      })),
    );

    // todo validacion de paginacion parse
    const paginacion = $('nav.pagination .col-md-4').text().trim();
    console.log(paginacion);

    // Usa una expresión regular para extraer los números
    const match = paginacion.match(/Mostrando (\d+)-(\d+) de (\d+)/);

    const desde = parseInt(match[1], 10);
    const hasta = parseInt(match[2], 10);
    const total = parseInt(match[3], 10);

    console.log({ desde, hasta, total });

    if (total > hasta) {
      // more pages. schedule new job with next page.
      let new_job_url;
      let new_page;
      if (page) {
        // schedule + 1 page number
        new_page = page + 1;
        new_job_url = url.replace(`?page=${page}`, `?page=${new_page}`);
      } else {
        new_job_url = url + '?page=2';
        new_page = 2;
      }

      await this.tasksService.createJob('NEXT_PAGE', root_url_id, {
        url: new_job_url,
        page: page ?? 2,
      });
    }

    return 'success';
  }

  async handleProduct(url: string, category_id: number, tienda_id: number) {
    const { status, data } = await this.networkService.get(url);

    //console.log(status, data);
    const $ = cheerio.load(data);

    const nombre = $('h1[itemprop="name"]').text().trim();
    console.log(nombre);

    const precio = $('span[itemprop="price"]').text().trim();
    console.log(precio);
    const precioNumerico = parseInt(precio.replace('$', '').replace('.', ''));

    const img_elements = $('img.thumb.js-thumb').toArray();
    const imagenes: string[] = [];

    for (const imagen of img_elements) {
      imagenes.push($(imagen).attr('data-image-large-src'));
    }
    console.log(imagenes);
    // todo solo guardar las url de las imagenes, dejar para la siguente iteracion mostrarlas

    const descripcion = $('div.product-description').text().trim();
    console.log(descripcion);

    // intentar obtener la marca de la informacion en la pagina.
    let marca = $('img.manufacturer-logo').attr('src');
    // todo integrar con servicio de mapeo / diccionario para traducir el link a un string de marca conocido.
    // todo fallback si no hay entonces consultar con IA.
    console.log(marca);
    if (marca.length === 0) {
      marca = 'FAILED-TO-GET-BRAND';
    }

    console.log('url del producto');
    console.log(url);

    // todo job has to include meta information: categoria
    // for now I linked the job to the root url which has this information as to avoid having stale info on here.

    // debe ser aqui esto? o en el save job data?
    const fingerprint_data = nombre + 'kpc' + 'liquid_cooling';

    console.log('hash:');
    const hash = this.utils.hash(fingerprint_data);
    console.log(hash);
    // todo adapter has to validate data was parsed or if not really set as null or fallback to other options
    await this.productsService.save_scraped_product_information(
      hash,
      nombre,
      category_id,
      url,
      tienda_id,
      imagenes,
      precioNumerico,
      descripcion,
      marca,
    );

    return 'success';
  }
}

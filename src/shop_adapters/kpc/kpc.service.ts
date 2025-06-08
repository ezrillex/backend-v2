import { Injectable } from '@nestjs/common';
import { IshopAdapter } from '../ishop-adapter';
import { NetworkService } from '../../core/network/network.service';
import * as cheerio from 'cheerio';
import { Priority } from '@prisma/client';
import { UtilsService } from '../../core/utils/utils.service';
import { ProductsService } from '../../products/products.service';
import { SchedulerService } from '../../scheduler/scheduler.service';
import { DictionaryService } from '../../dictionary/dictionary.service';

export type KPC_JobDataType = {
  url: string;
  page?: number;
};

@Injectable()
export class KpcService implements IshopAdapter<KPC_JobDataType> {
  constructor(
    private readonly networkService: NetworkService,
    private readonly utils: UtilsService,
    private readonly productsService: ProductsService,
    private readonly schedulerService: SchedulerService,
    private readonly dictionaryService: DictionaryService,
  ) {}

  async scrape(
    job_data: KPC_JobDataType,
    category_id: string,
    tienda_id: string,
    source_id: string,
    priority: Priority,
  ): Promise<string> {
    let outcome: string;
    if (priority === Priority.PAGE || priority === Priority.NEXT_PAGE) {
      outcome = await this.handlePage(job_data.url, source_id, job_data.page);
    } else if (priority === Priority.PRODUCT) {
      outcome = await this.handleProduct(job_data.url, category_id, tienda_id);
    } else {
      // todo fail the job as unkown priority / not set.
      outcome = 'priority-switch-failure';
    }

    // update the job w/ outcome.
    return outcome;
  }
  async handlePage(url: string, source_id: string, page?: number) {
    const { status, data } = await this.networkService.get(url);

    // todo validacion de pagina no vacia
    const $ = cheerio.load(data);
    const articles = $('article').toArray();
    const product_urls: string[] = [];
    for (const article of articles) {
      const product_url = $(article).find('h2 a').attr('href');
      // todo validacion que sea un url valido?
      product_urls.push(product_url);
    }
    const unique_product_urls: string[] = [...new Set(product_urls)];
    await this.schedulerService.createManyJobs(
      unique_product_urls.map((data) => ({
        job_data: { url: data },
        source_id: source_id,
        priority: 'PRODUCT',
      })),
    );

    // todo validacion de paginacion parse
    const paginacion = $('nav.pagination .col-md-4').text().trim();

    // Usa una expresión regular para extraer los números
    const match = paginacion.match(/Mostrando (\d+)-(\d+) de (\d+)/);

    const desde = parseInt(match[1], 10);
    const hasta = parseInt(match[2], 10);
    const total = parseInt(match[3], 10);

    // in the zd i have a field for this instead of building the url now, idk which might be best tbh for now leave it like so.
    if (total > hasta) {
      // more pages. schedule new job with next page.
      let new_job_url: string;
      let new_page: number;
      if (page) {
        // schedule + 1 page number
        new_page = page + 1;
        new_job_url = url.replace(`?page=${page}`, `?page=${new_page}`);
      } else {
        new_job_url = url + '?page=2';
        new_page = 2;
      }

      await this.schedulerService.createJob('NEXT_PAGE', source_id, {
        url: new_job_url,
        page: new_page,
      });
    }

    return 'success';
  }

  async handleProduct(url: string, category_id: string, tienda_id: string) {
    const { status, data } = await this.networkService.get(url);

    const $ = cheerio.load(data);

    const nombre = $('h1[itemprop="name"]').text().trim();

    const precio = $('#our_price_display').text().trim();
    const precioNumerico = parseInt(
      precio.replace('$', '').replace('.', '').replace(',', ''),
    );

    const img_elements = $('img.thumb.js-thumb').toArray();
    const imagenes: string[] = [];

    for (const imagen of img_elements) {
      imagenes.push($(imagen).attr('data-image-large-src'));
    }

    const description = $('div.product-description').text().trim();

    const summary = $('div.product-description-short').text().trim();

    const details = summary + '\n' + description;

    // intentar obtener la marca de la informacion en la pagina.
    let marca = $('img.manufacturer-logo').attr('src');
    // todo integrar con servicio de mapeo / diccionario para traducir el link a un string de marca conocido.
    marca = await this.dictionaryService.getDictionaryDefinition(marca);

    // todo move this to save product maybe.
    const fingerprint_data = nombre + 'kpc';

    const hash = this.utils.hash(fingerprint_data);
    // todo adapter has to validate data was parsed or if not really set as null or fallback to other options
    await this.productsService.save_scraped_product_information(
      hash,
      nombre,
      category_id,
      url,
      tienda_id,
      imagenes,
      precioNumerico,
      details,
      marca,
    );

    return 'success';
  }
}

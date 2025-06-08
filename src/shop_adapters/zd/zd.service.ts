import { Injectable } from '@nestjs/common';
import { IshopAdapter } from '../ishop-adapter';
import { Priority } from '@prisma/client';
import { NetworkService } from '../../core/network/network.service';
import { SchedulerService } from '../../scheduler/scheduler.service';
import { ProductsService } from '../../products/products.service';
import { UtilsService } from '../../core/utils/utils.service';
import * as cheerio from 'cheerio';

export type ZD_JobDataType = {
  category_id?: string;
  category_second_id?: string;
  category_third_id?: string;
  page?: number;
  slug?: string;
};

@Injectable()
export class ZdService implements IshopAdapter<ZD_JobDataType> {
  constructor(
    private readonly networkService: NetworkService,
    private readonly schedulerService: SchedulerService,
    private readonly productService: ProductsService,
    private readonly utils: UtilsService,
  ) {}

  async scrape(
    job_data: ZD_JobDataType,
    category_id: string,
    tienda_id: string,
    source_id: string,
    priority: Priority,
  ): Promise<string> {
    let outcome: string;
    if (priority === 'NEXT_PAGE' || priority === 'PAGE') {
      outcome = await this.handlePage(
        source_id,
        job_data.category_id,
        job_data.category_second_id,
        job_data.category_third_id,
        job_data.page,
      );
    } else if (priority === 'PRODUCT') {
      outcome = await this.handleProduct(job_data.slug, category_id, tienda_id);
    } else {
      // todo fail the job as unkown priority / not set.
      outcome = 'priority-switch-failure';
    }

    return outcome;
  }

  async handlePage(
    source_id: string,
    category_id: string,
    category_second_id: string,
    category_third_id: string,
    page?: number,
  ) {
    let page_string = '?page=1';
    let page_int = 1;
    if (page) {
      page_string = '?page=' + page;
      page_int = page;
    }
    const request_data = {
      min_price: null,
      max_price: null,
      marcas_selected: [],
      categories_add_selected: [],
      size_page: 60,
      tag_selected: null,
    };
    if (category_id) {
      request_data['categorie_id'] = category_id;
    }
    if (category_second_id) {
      request_data['categorie_second_id'] = category_second_id;
    }
    if (category_third_id) {
      request_data['categorie_third_id'] = category_third_id;
    }

    const { status, data } = await this.networkService.post(
      `[REDACTED]`,
      request_data,
    );

    // console.log(data);

    // determine if there is a next page then schedule a job for it
    if (page_int < data.total_pages) {
      // there is a next page
      await this.schedulerService.createJob(Priority.NEXT_PAGE, source_id, {
        category_id: category_id,
        category_third_id: category_third_id,
        page: page_int + 1,
      });
    }
    // schedule jobs for products in this page.
    // console.log(data.products.data);
    const product_jobs: {
      job_data: object;
      priority: Priority;
      source_id: string;
    }[] = data.products.data.map((product) => {
      return {
        job_data: { slug: product.slug },
        priority: Priority.PRODUCT,
        source_id: source_id,
      };
    });

    await this.schedulerService.createManyJobs(product_jobs);

    return 'success';
  }

  async handleProduct(slug: string, category_id: string, tienda_id: string) {
    const { status, data } = await this.networkService.get(
      `[REDACTED]`,
    );

    const product = data.product;
    let price: number;
    if (product.discount_g) {
      // discount found
      price = product.discount_g.new_amount;
      // todo logic that maybe marks in our UI that a price is discounted.
    } else {
      price = product.precio_general;
    }
    price = price * 100; // agregar centavos / uniformidad entre adapters.

    const name = product.title;

    const url = '[REDACTED]' + product.slug;

    let brand = product.marca?.name ?? '';
    if (brand) {
      brand = brand.trim();
    }

    // No hay modelo skiped.

    const imagenes: string[] = product.images.map((image) => {
      return image.imagen;
    });

    let details = '';

    if (product.summary) {
      details += product.summary + '\n';
    }

    if (product.description) {
      try {
        const $ = cheerio.load(product.description);
        const cleanDescription = $.text();
        // console.log(cleanDescription);
        details += cleanDescription;
      } catch (e) {
        console.log('parsing description failed, using only summary');
      }
    }

    details = details.trim();

    // todo move to save prod info
    const fingerprint_data = name + 'zonadigital';

    const hash = this.utils.hash(fingerprint_data);

    await this.productService.save_scraped_product_information(
      hash,
      name,
      category_id,
      url,
      tienda_id,
      imagenes,
      price,
      details,
      brand,
    );

    return 'success';
  }
}

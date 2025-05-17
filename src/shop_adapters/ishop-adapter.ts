import { Priority } from '@prisma/client';

export interface IshopAdapter<TJobData> {
  scrape(
    job_data: TJobData,
    category_id: bigint,
    tienda_id: bigint,
    root_url_id: bigint,
    priority: Priority,
  ): Promise<string>; // todo maybe manage a status enum instead of a string? is the data we pass normalized or each adapter needs its own ?
  // todo consider if handle page and handle product should be standard such that I have that logic at job scheduler level.
}

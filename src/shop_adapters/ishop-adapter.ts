export interface IshopAdapter {
  scrape(data: any): Promise<string>; // todo maybe manage a status enum instead of a string? is the data we pass normalized or each adapter needs its own ?
  // todo consider if handle page and handle product should be standard such that I have that logic at job scheduler level.
}

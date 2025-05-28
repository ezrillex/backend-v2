import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { LogService } from 'src/core/log/log.service';

@Injectable()
export class NetworkService {
  constructor(
    private readonly httpService: HttpService,
    private readonly logs: LogService,
  ) {}

  chrome_headers = {
    accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-encoding': 'gzip, deflate, br', // zstd ommited / not supported by axios.
    'accept-language': 'es-US,es-419;q=0.9,es;q=0.8',
    'cache-control': 'no-cache',
    pragma: 'no-cache',
    priority: 'u=0, i',
    'sec-ch-ua':
      '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
  };

  chrome_image_headers = {
    accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'accept-language': 'es-US,es-419;q=0.9,es;q=0.8',
    'cache-control': 'no-cache',
    pragma: 'no-cache',
    priority: 'i',
    'sec-ch-ua':
      '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'image',
    'sec-fetch-mode': 'no-cors',
    'sec-fetch-site': 'same-origin',
  };

  async get(url: string) {
    const { status, headers, data, config, statusText, request } =
      await firstValueFrom(
        this.httpService.get(url, {
          timeout: 30000,
          headers: this.chrome_headers,
          decompress: true,
        }),
      );

    //console.log(status);
    //console.log(headers);

    await this.logs.logMany([
      {
        type: 'network',
        data: JSON.stringify({
          status,
          headers,
          config,
          statusText,
        }),
      },
      {
        type: 'network-data',
        data: data,
        compress: true,
      },
    ]);

    return {
      status: status,
      data: data,
    };
  }

  async getImage(url: string) {
    const response = await firstValueFrom(
      this.httpService.get(url, {
        headers: this.chrome_image_headers,
        responseType: 'arraybuffer',
      }),
    );

    return Buffer.from(response.data, 'binary');
  }
}

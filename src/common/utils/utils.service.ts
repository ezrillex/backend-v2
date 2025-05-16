import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { gzip } from 'zlib';
import { promisify } from 'util';

@Injectable()
export class UtilsService {
  gzipAsync = promisify(gzip);

  hash(data: string) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  async compress(data: string): Promise<string> {
    const compressed = await this.gzipAsync(data);
    return compressed.toString('base64');
  }
}

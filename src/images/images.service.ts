import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, FileStat, WebDAVClient } from 'webdav';
import { PrismaService } from '../core/prisma/prisma.service';
import { NetworkService } from '../core/network/network.service';
import sharp from 'sharp';

@Injectable()
export class ImagesService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly networkService: NetworkService,
  ) {}

  webdav_client: WebDAVClient;

  async onModuleInit() {
    console.log('logging in to web disk client...');
    this.webdav_client = createClient('[REDACTED]', {
      username: 'cdn_manager@0001329.xyz',
      password: '[REDACTED]',
    });
    console.log('checking buckets exists');
    await this.check_buckets_exist();
    console.log('done');
  }

  async check_buckets_exist() {
    const contents: FileStat[] = (await this.webdav_client.getDirectoryContents(
      process.env.WEB_DISK_BASE_PATH,
      {
        deep: false,
        details: false,
      },
    )) as FileStat[];

    // console.log(contents);

    const omit = ['.well-known', 'cgi-bin', 'test.jpg', '000dev', '000docs'];

    const buckets = contents.filter((item) => !omit.includes(item.basename));

    // make sure folders are init.
    for (let i = 0; i <= parseInt(process.env.MAX_BUCKETS); i++) {
      const code = i.toString().padStart(3, '0');

      const exists = buckets.some((bucket) => bucket.basename === code);
      if (!exists) {
        // code to create the folder.
        await this.webdav_client.createDirectory(
          `${process.env.WEB_DISK_BASE_PATH}${code}`,
        );
        console.log('Created directory ', code);
      }
    }

    // todo maybe check integrity? so check if our db matches what is in the folders.
  }

  async getAvailableBucket() {
    // get bucket capacity.
    const capacities = await this.prisma.images.groupBy({
      by: ['bucket'],
      orderBy: {
        bucket: 'asc',
      },
      _count: { _all: true },
      where: {
        bucket: {
          not: null,
        },
      },
    });

    const bucketCapacity = new Map<number, number>();
    for (const cap of capacities) {
      bucketCapacity.set(cap.bucket, cap._count._all);
    }

    // determine bucket with capacity
    for (let i = 0; i <= parseInt(process.env.MAX_BUCKETS); i++) {
      const selected_capacity = bucketCapacity.get(i);
      if (
        selected_capacity === undefined ||
        selected_capacity < parseInt(process.env.IMAGES_PER_BUCKET)
      ) {
        // check if under bucket max capacity of 100 or env var.
        return i;
      }
    }
    // if no one was found it reaches here.
    throw new Error('All image buckets are full');
  }

  async scrapeImage(id: string, url: string) {
    // download image
    const image = await this.networkService.getImage(url);

    // optimize image
    const optimized = await sharp(image)
      // .removeAlpha()
      .flatten({ background: '#ffffff' })
      .toFormat('webp', {
        quality: 70,
        effort: 6,
        smartSubsample: true,
        smartDeblock: true,
        preset: 'picture',
        force: true,
      })
      .toBuffer();

    // upload image
    const bucket = await this.getAvailableBucket();
    const bucketString = bucket.toString().padStart(3, '0');
    const upload = await this.webdav_client.putFileContents(
      `${process.env.WEB_DISK_BASE_PATH}${bucketString}/${id}.webp`,
      optimized,
      { overwrite: true },
    );

    if (upload) {
      // success
      console.log('succesfully uploaded image:');
      console.log(
        `[REDACTED]`,
      );
      // update image record with bucket number.
      await this.prisma.images.update({
        data: {
          bucket: bucket,
        },
        where: {
          id: id,
        },
      });
    }
  }
}

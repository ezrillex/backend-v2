import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../core/prisma/prisma.service';
import { JobStatus, Priority } from '@prisma/client';
import { LogService } from '../core/log/log.service';
import { KPC_JobDataType, KpcService } from '../shop_adapters/kpc/kpc.service';
import { JsonValue } from '@prisma/client/runtime/library';
import { SchedulerService } from 'src/scheduler/scheduler.service';
import { ImagesService } from '../images/images.service';
import { ZD_JobDataType, ZdService } from '../shop_adapters/zd/zd.service';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kpcService: KpcService,
    private readonly zdService: ZdService,
    private readonly schedulerService: SchedulerService,
    private readonly logs: LogService,
    private readonly imagesService: ImagesService,
  ) {}

  @Cron('* * * * *')
  async systemCron(): Promise<void> {
    const usage = process.memoryUsage();
    const usedMB = (usage.heapUsed / 1024 / 1024).toFixed(2);
    const totalMB = (usage.heapTotal / 1024 / 1024).toFixed(2);
    const memoryUsage = ((usage.heapUsed / usage.heapTotal) * 100).toFixed(2);
    // eslint-disable-next-line
    console.log(
      `Current Time: ${new Date().toLocaleString()}, memory used: ${usedMB} MB, total: ${totalMB} MB, ${memoryUsage}%, random number: ${Math.random()}`,
    );
  }

  @Cron('* * * * *')
  async scrapeTask() {
    // get next jobs from database, lock job
    const job_ids: { id: string }[] = await this.prisma
      .$queryRaw`SELECT DISTINCT ON (s.shop_id) jq.id
FROM "JobQueue" jq
JOIN "Sources" s ON jq.source_id = s.id
WHERE jq.status = 'PENDING'
ORDER BY s.shop_id, 
         CASE jq.priority 
            WHEN 'NEXT_PAGE' THEN 0 
            WHEN 'PAGE' THEN 1 
            WHEN 'PRODUCT' THEN 2 
            ELSE 3 
         END;`;
    const flat_ids = job_ids.map((row) => row.id);
    // console.log(flat_ids);

    const jobs = await this.prisma.jobQueue.findMany({
      select: {
        id: true,
        job_data: true,
        priority: true,
        source_id: true,
        source: {
          select: {
            shop_id: true,
            category_id: true,
            shop: {
              select: {
                adapter: true,
              },
            },
          },
        },
      },
      where: {
        id: {
          in: flat_ids,
        },
      },
    });

    // for with switch to call shop adapters as promises
    const runningJobs: Promise<void>[] = [];
    for (const job of jobs) {
      // console.log(job);
      runningJobs.push(this.processJob(job));
    }
    // wait for adapters to finish, make sure that adapters have a timeout.
    await Promise.all(runningJobs);
  }

  @Cron('30 * * * * *')
  async imageTask() {
    console.log(new Date().toLocaleString());

    const img = await this.prisma.images.findFirst({
      where: {
        bucket: {
          equals: null,
        },
      },
    });
    if (img) {
      await this.imagesService.scrapeImage(img.id, img.scraped_url);
    }
  }

  async processJob(job: {
    id: string;
    job_data: JsonValue;
    priority: Priority;
    source_id: string;
    source: {
      category_id: string;
      shop_id: string;
      shop: {
        adapter: string;
      };
    };
  }) {
    try {
      let result: string;
      switch (job.source.shop.adapter) {
        case 'KPC':
          result = await this.kpcService.scrape(
            job.job_data as KPC_JobDataType,
            job.source.category_id,
            job.source.shop_id,
            job.source_id,
            job.priority,
          );
          break;
        case 'ZD':
          result = await this.zdService.scrape(
            job.job_data as ZD_JobDataType,
            job.source.category_id,
            job.source.shop_id,
            job.source_id,
            job.priority,
          );
      }

      // unlock jobs update statuses
      await this.finishJob(result, job.id);
    } catch (error) {
      // unlock jobs update statuses
      await this.finishJob('promise-error', job.id);
      await this.logs.log(
        'job-promise-error',
        JSON.stringify({
          id: job.id,
          error: error,
        }),
      );
      console.log('Logged error: ', error);
    }
  }

  async finishJob(outcome: string, job_id: string) {
    let dbState = outcome === 'success' ? JobStatus.SUCCESS : JobStatus.FAIL;

    await this.prisma.jobQueue.update({
      data: {
        processed_at: new Date(),
        status: dbState,
      },
      where: {
        id: job_id,
      },
    });
  }

  // job that schedules next batch of jobs
  @Cron('0 3 * * *')
  async scheduleDailyTasks() {
    console.log('daily work schedule start ');
    const start = performance.now();
    // todo mechanism to check if this job didnt run and try to run it. maybe on startup or hourly / half hourly.
    // for each source schedule a job
    const sources = await this.prisma.sources.findMany({
      select: { id: true, data: true },
    });

    await this.schedulerService.createManyJobs(
      sources.map((data) => ({
        job_data: data.data as object,
        source_id: data.id,
        priority: Priority.PAGE,
      })),
    );

    console.log(`finished daily schedule in: ${performance.now() - start}ms`);
  }
}

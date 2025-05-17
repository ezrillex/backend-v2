import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../core/prisma/prisma.service';
import { JobStatus, Priority } from '@prisma/client';
import { LogService } from '../core/log/log.service';
import { KpcService } from '../shop_adapters/kpc/kpc.service';
import { JsonValue } from '@prisma/client/runtime/library';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logs: LogService,
    private readonly kpcService: KpcService,
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
    const job_ids: { id: number }[] = await this.prisma
      .$queryRaw`SELECT DISTINCT ON (r.shop_id) jq.id
FROM "JobQueue" jq
JOIN "RootUrls" r ON jq.root_url_id = r.id
WHERE jq.status = 'PENDING'
ORDER BY r.shop_id, 
         CASE jq.priority 
            WHEN 'NEXT_PAGE' THEN 0 
            WHEN 'PAGE' THEN 1 
            WHEN 'PRODUCT' THEN 2 
            ELSE 3 
         END;`;
    const flat_ids = job_ids.map((row) => row.id);
    console.log(flat_ids);

    const jobs = await this.prisma.jobQueue.findMany({
      select: {
        id: true,
        job_data: true,
        priority: true,
        root_url_id: true,
        root_url: {
          select: {
            shop_id: true,
            category_id: true,
          },
        },
      },
      where: {
        id: {
          in: flat_ids,
        },
      },
    });

    console.log(jobs);
    // for with switch to call shop adapters as promises
    const runningJobs: Promise<void>[] = [];
    for (const job of jobs) {
      console.log(job);
      runningJobs.push(this.processJob(job));
    }
    // should the shop adapter log stuff by itself? job state management?
    // { outcome: 'success' }
    // wait for adapters to finish, make sure that adapters have a timeout.
    await Promise.all(runningJobs);
    // so in theory we could have concurrent shop request as long as there is not a locked job for x shop. We could go for a simple cooldown 60 seconds, have the thing run 15 seconds maybe?
    // why not parallel tho? like just get all possible shop ones and fire them at once. No checking for if x passed and having this run at once. This could also be an indicator of if a job is stuck, like 60 seconds is too long. However there is an issue, if thing is running it will block from running new one. Yeah so it does have to be parallel.
  }

  async processJob(job: {
    id: bigint;
    job_data: JsonValue;
    priority: Priority;
    root_url_id: bigint;
    root_url: {
      category_id: bigint;
      shop_id: bigint;
    };
  }) {
    // todo switch case
    try {
      const result = await this.kpcService.scrape(
        job.job_data as {
          url: string;
          page?: number;
        },
        job.root_url.category_id,
        job.root_url.shop_id,
        job.root_url_id,
        job.priority,
      );
      // unlock jobs update statuses
      await this.finishJob(result, job.id);
    } catch (error) {
      // unlock jobs update statuses
      await this.finishJob('failure-promise-error', job.id);
    }
  }

  async finishJob(outcome: string, job_id: bigint) {
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
  scheduleDailyTasks() {
    // for each root url schedule a job
  }
}

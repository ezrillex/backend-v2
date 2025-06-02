import { Injectable } from '@nestjs/common';
import { Priority } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';
import { LogService } from '../core/log/log.service';

@Injectable()
export class SchedulerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logs: LogService,
  ) {}

  // helps page jobs to schedule each product scrape and next page scheduling
  async createJob(priority: Priority, source_id: string, job_data: object) {
    await this.prisma.jobQueue.create({
      data: {
        job_data,
        priority,
        source: {
          connect: {
            id: source_id,
          },
        },
      },
    });
    await this.logs.log(
      'create-jobs-single',
      `Created Job: ${priority}, root: ${source_id}, data: ${JSON.stringify(job_data)}`,
    );
  }

  async createManyJobs(
    jobs: { job_data: object; source_id: string; priority: Priority }[],
  ) {
    await this.prisma.jobQueue.createMany({
      data: jobs,
    });

    await this.logs.log(
      'create-jobs-multiple',
      `Created Jobs: ${JSON.stringify(jobs)}`,
    );
  }
}

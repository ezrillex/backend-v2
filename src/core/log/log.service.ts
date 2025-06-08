import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UtilsService } from '../utils/utils.service';

@Injectable()
export class LogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utils: UtilsService,
  ) {}

  async log(type: string, data: string, compress?: boolean) {
    let value: string;
    if (compress) {
      value = await this.utils.compress(data);
    } else {
      value = data;
    }

    await this.prisma.logs.create({
      data: {
        type: type,
        data: value,
      },
    });
  }

  async logMany(logs: { type: string; data: string; compress?: boolean }[]) {
    const processed_logs: { type: string; data: string }[] = [];
    for (const log of logs) {
      if (log.compress) {
        const compressed = await this.utils.compress(log.data);
        processed_logs.push({ type: log.type, data: compressed });
      } else {
        processed_logs.push({ type: log.type, data: log.data });
      }
    }
    await this.prisma.logs.createMany({
      data: processed_logs,
    });
  }

  async searchTelemetry(
    search: string,
    result_count: number,
    time_taken: number,
  ) {
    await this.prisma.searchTelemetry.create({
      data: {
        search,
        result_count,
        time_taken,
      },
    });
  }

  async getProductTelemetry(
    requested: string,
    found_results: boolean,
    time_taken: number,
  ) {
    await this.prisma.getProductTelemetry.create({
      data: {
        requested,
        found_results,
        time_taken,
      },
    });
  }

  async getCategoryProductsTelemetry(
    requested: string,
    result_count: number,
    time_taken: number,
  ) {
    await this.prisma.getCategoryProductsTelemetry.create({
      data: {
        requested,
        result_count,
        time_taken,
      },
    });
  }

  async taskTelemetry(task: string, time_taken: number) {
    await this.prisma.taskTelemetry.create({
      data: {
        task,
        time_taken,
      },
    });
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { ZdService } from './zd.service';

describe('ZdService', () => {
  let service: ZdService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZdService],
    }).compile();

    service = module.get<ZdService>(ZdService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

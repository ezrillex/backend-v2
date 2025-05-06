import { Test, TestingModule } from '@nestjs/testing';
import { KpcService } from './kpc.service';

describe('KpcService', () => {
  let service: KpcService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KpcService],
    }).compile();

    service = module.get<KpcService>(KpcService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

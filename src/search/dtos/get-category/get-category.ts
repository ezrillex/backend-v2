import { IsUUID } from 'class-validator';

export class GetCategory {
  @IsUUID('7')
  id: string;
}

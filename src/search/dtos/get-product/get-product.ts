import { IsUUID } from 'class-validator';

export class GetProduct {
  @IsUUID('7')
  id: string;
}

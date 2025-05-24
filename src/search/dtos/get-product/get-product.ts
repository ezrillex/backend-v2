import { IsString, IsUUID, Length, MaxLength } from 'class-validator';
import stripAnsi from 'strip-ansi-cjs';
import { Transform } from 'class-transformer';

export class GetProduct {
  // @Transform(({ value }) => {
  //   return stripAnsi(value).trim();
  // })
  @IsUUID('7')
  id: string;
}

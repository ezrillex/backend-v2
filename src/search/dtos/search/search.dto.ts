import { IsString, Length } from 'class-validator';

export class Search {
  @IsString()
  @Length(1, 150)
  query: string;
}

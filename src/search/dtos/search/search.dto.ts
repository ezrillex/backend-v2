import { Length, MaxLength } from 'class-validator';
import stripAnsi from 'strip-ansi-cjs';
import { Transform } from 'class-transformer';

export class Search {
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      throw new Error('Value is not of type string');
    }
    return stripAnsi(value.slice(0, 1024)).trim();
  })
  @Length(1, 150)
  query: string;
}

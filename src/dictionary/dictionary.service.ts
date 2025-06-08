import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';

@Injectable()
export class DictionaryService {
  constructor(private readonly prisma: PrismaService) {}

  async getDictionaryDefinition(data: string) {
    if (!data || data.trim().length === 0) {
      return '';
    }

    const definition = await this.prisma.dictionary.findUnique({
      where: {
        input: data.trim(),
      },
    });

    if (definition) {
      return definition.output;
    } else {
      // create a entry for manual processing. On the next job this will make sure we fetch the right definition and clean the pending notice.
      await this.prisma.dictionary.create({
        data: {
          input: data.trim(),
          output: 'DICTIONARY-DEFINITION-PENDING',
        },
      });
      return 'DICTIONARY-DEFINITION-PENDING'; // osea al siguente este brand sera sobre-escrito si ya encuentra una definicion.
    }
  }
}

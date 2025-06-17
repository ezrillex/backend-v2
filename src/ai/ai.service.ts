import { Injectable, OnModuleInit } from '@nestjs/common';
import { NetworkService } from '../core/network/network.service';
import { GoogleGenAI } from '@google/genai';
import { PrismaService } from '../core/prisma/prisma.service';
import { LogService } from '../core/log/log.service';

@Injectable()
export class AiService implements OnModuleInit {
  constructor(
    private readonly networkService: NetworkService,
    private readonly prisma: PrismaService,
    private readonly logs: LogService,
  ) {}

  onModuleInit() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_AI_KEY,
    });
  }

  ai: GoogleGenAI;

  async inferKeywords() {
    const product = await this.prisma.products.findFirst({
      select: {
        id: true,
        name: true,
        details: true,
      },
      where: {
        keywords: null,
      },
    });

    if (!product) {
      return;
    }

    let prompt =
      'Dado el título, descripción y otros datos de un producto, genera una lista amplia y diversa de palabras clave y frases útiles para mejorar búsquedas SEO técnicas y funcionales.\n' +
      'Incluye sinónimos, especificaciones técnicas, categorías funcionales y términos relacionados que un usuario usaría para encontrar el producto.\n' +
      'Devuelve solo la lista separada por un espacio, sin explicaciones ni repeticiones.\n' +
      'No inventes marcas, modelos, componentes o accesorios no mencionados explícitamente.\n' +
      'No incluyas términos sobre precios, ofertas, opiniones, compras, stock, países o promociones.\n' +
      'Evita variaciones mínimas de un mismo término (espacios, guiones, mayúsculas, pluralización).\n' +
      'Prioriza términos comunes y relevantes, evitando términos excesivamente técnicos o poco usados en búsquedas reales.\n' +
      'Producto:\n';

    prompt += product.name + '\n';
    if (product.details) {
      prompt += product.details;
    }

    const response = await this.ai.models.generateContent({
      model: 'gemma-3-27b-it',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.9,
        httpOptions: {
          timeout: 30_000,
        },
      },
    });

    if (typeof response.text === 'string') {
      await this.prisma.products.update({
        where: {
          id: product.id,
        },
        data: {
          keywords: response.text.trim(),
        },
      });
    } else {
      // try again with another model (smarter model with less rate limit, only use for these scenarios / edge cases)
      const fallback = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          temperature: 0.7,
          topP: 0.9,
          httpOptions: {
            timeout: 30_000,
          },
        },
      });
      if (typeof fallback.text === 'string') {
        await this.prisma.products.update({
          where: {
            id: product.id,
          },
          data: {
            keywords: fallback.text.trim(),
          },
        });
      } else {
        await this.logs.log('gemini-response-error', JSON.stringify(response));
        await this.logs.log('gemini-response-error-prompt', prompt);
        await this.prisma.products.update({
          where: {
            id: product.id,
          },
          data: {
            keywords: '', // sets empty string as to be able for me to find it and not be processed and not influence the search.
          },
        });
      }
    }
  }

  async inferBrand() {
    const product = await this.prisma.products.findFirst({
      select: {
        id: true,
        name: true,
        details: true,
        categoria: {
          select: {
            name: true,
          },
        },
      },
      where: {
        marca: '',
      },
    });

    if (!product) {
      return;
    }

    let prompt =
      'Idioma: Español.\n' +
      'Extrae exclusivamente el nombre de la marca del siguiente producto, usando su título y descripción.\n' +
      'Si detectas una marca, responde solo con el nombre exacto de la marca, sin ningún otro texto.\n' +
      'No confundas números de modelo, códigos de producto ni características técnicas con marcas.\n' +
      'Si no puedes determinar una marca clara, responde exactamente: Genérico.\n';

    prompt += `Categoria: ${product.categoria.name}\n`;
    prompt += 'Producto:\n';
    prompt += product.name + '\n';
    if (product.details) {
      prompt += product.details;
    }

    const response = await this.ai.models.generateContent({
      model: 'gemma-3-27b-it',
      contents: prompt,
      config: {
        temperature: 0,
        topP: 1,
      },
    });

    await this.prisma.products.update({
      where: {
        id: product.id,
      },
      data: {
        marca: response.text.trim(),
      },
    });
  }
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      ignoreTrailingSlash: true,
    }),
  );

  app.enableCors(); // todo for testing purposes i enabled this.
  await app.listen(process.env.PORT ?? 3000);
}
// noinspection JSIgnoredPromiseFromCall
bootstrap();

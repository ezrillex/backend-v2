import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(); // todo for testing purposes i enabled this.
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

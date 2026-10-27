import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp, swaggerEnabled } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  configureApp(app);

  // API docs are for development: off in production unless asked for, so the
  // full route and schema map isn't handed to anyone probing the server.
  if (swaggerEnabled(config)) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('BrewMap AI API')
      .setDescription('Taste-first café discovery for Chiang Mai')
      .setVersion('0.1.0')
      .build();
    SwaggerModule.setup(
      'api/docs',
      app,
      SwaggerModule.createDocument(app, swaggerConfig),
    );
  }

  await app.listen(config.get<number>('PORT', 4000));
}
void bootstrap();

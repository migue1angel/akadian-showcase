import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config/envs';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';


async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.setGlobalPrefix('api/v1');

  app.use(cookieParser());

  app.enableCors({credentials: true, origin: envs.frontendUrl});

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (envs.nodeEnv !== 'production') {
    const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');
    const config = new DocumentBuilder()
      .setTitle('Akadian Showcase API')
      .setVersion('1.0')
      .addCookieAuth('accessToken')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(envs.port ?? 3000);
}
bootstrap();

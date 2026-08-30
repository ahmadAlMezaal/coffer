import 'reflect-metadata';
import './config/env';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { API_PORT } from './config/app';

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  await app.listen(API_PORT);

  Logger.log(`Coffer API listening on ${API_PORT}`, 'Bootstrap');
};

void bootstrap();

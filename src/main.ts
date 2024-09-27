import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import "reflect-metadata"
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }));
  app.enableCors({
    origin: `${process.env.FRONTEND_IP_ADDRESS}`, // Replace when frontend URL is set up in instance
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization', //uncomment before push for deploy
  });
  await app.listen(3001);
}
bootstrap();

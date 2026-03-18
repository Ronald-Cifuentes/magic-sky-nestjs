import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { ValidationError } from 'class-validator';

function flattenValidationErrors(errors: ValidationError[], prefix = ''): string[] {
  const messages: string[] = [];
  for (const err of errors) {
    const prop = prefix ? `${prefix}.${err.property}` : err.property;
    if (err.constraints) {
      messages.push(...Object.values(err.constraints));
    }
    if (err.children?.length) {
      messages.push(...flattenValidationErrors(err.children, prop));
    }
  }
  return messages;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({ contentSecurityPolicy: process.env.NODE_ENV === 'production' }));
  app.use(cookieParser());

  const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map((o) => o.trim());
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = flattenValidationErrors(errors);
        return new BadRequestException(messages.length ? messages.join('; ') : 'Validation failed');
      },
    }),
  );

  const port = parseInt(process.env.PORT || '4000', 10);
  await app.listen(port);
  console.log(`Magic Sky API running at http://localhost:${port}/graphql`);
}

bootstrap().catch(console.error);

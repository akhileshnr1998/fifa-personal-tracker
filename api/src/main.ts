import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
  const configuredOrigins = corsOrigin.split(',').map((origin) => origin.trim());
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || configuredOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      if (!isProduction && /^http:\/\/localhost:\d+$/.test(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

void bootstrap();

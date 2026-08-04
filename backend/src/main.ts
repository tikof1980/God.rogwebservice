import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { assertProductionSecretsAreSet } from './config/startup-guards';

async function bootstrap() {
  assertProductionSecretsAreSet();

  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  // CORS : en production, restreindre aux domaines déclarés dans
  // ALLOWED_ORIGINS (séparés par des virgules). Sans cette variable,
  // reste ouvert (pratique en développement, à ne jamais laisser tel
  // quel avec de vraies données en production).
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim());
  app.enableCors({
    origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`GOD.ROGWEBSERVICE API démarrée sur http://localhost:${port}`);
}
bootstrap();

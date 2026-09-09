import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Echoue au demarrage plutot qu'a la premiere requete pour un secret
 * manquant (JWT_ACCESS_SECRET) — sinon passport-jwt/jsonwebtoken ne
 * decouvrent le probleme qu'au premier appel authentifie. TOKEN_ENCRYPTION_KEY
 * reste optionnelle en dev (voir TokenCipherService, repli sur du clair avec
 * avertissement) mais devient obligatoire en production : un oubli ne doit
 * jamais silencieusement stocker des secrets (jetons OAuth, mfaSecret) en
 * clair.
 */
function validateEnv(): void {
  if (!process.env.JWT_ACCESS_SECRET) {
    throw new Error('JWT_ACCESS_SECRET environment variable is required');
  }
  if (
    process.env.NODE_ENV === 'production' &&
    !process.env.TOKEN_ENCRYPTION_KEY
  ) {
    throw new Error(
      'TOKEN_ENCRYPTION_KEY is required in production (otherwise OAuth tokens and MFA secrets are stored in plaintext)',
    );
  }
}

async function bootstrap() {
  validateEnv();
  const app = await NestFactory.create(AppModule);
  // Restreint aux origines connues du front — WEB_APP_URL (une ou plusieurs,
  // separees par des virgules), plutot qu'un enableCors() sans options qui
  // reflechit n'importe quelle origine.
  const allowedOrigins = (process.env.WEB_APP_URL ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim());
  app.enableCors({ origin: allowedOrigins });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

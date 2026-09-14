import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

/**
 * Le refresh token ne doit jamais transiter par le JSON ni etre lisible en
 * JS cote client (voir auth.controller.ts) — pose en cookie httpOnly,
 * a rotation, revoque a la deconnexion. Verifie ici bout en bout plutot
 * que par relecture de code seule, etant donne la sensibilite du sujet.
 */
interface AuthResponseBody {
  accessToken?: string;
  refreshToken?: string;
}

describe('Auth cookie flow (e2e)', () => {
  let app: INestApplication<App>;
  const email = `cookie-e2e-${Date.now()}@example.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  function extractCookie(
    res: request.Response,
    name: string,
  ): string | undefined {
    const raw =
      (res.headers['set-cookie'] as unknown as string[] | undefined) ?? [];
    const line = raw.find((c) => c.startsWith(`${name}=`));
    return line?.split(';')[0].split('=')[1];
  }

  it('register: renvoie accessToken sans refreshToken, pose un cookie httpOnly', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        tenantName: 'Cookie E2E Co',
        email,
        password: 'cookiee2epass123',
        firstName: 'Cookie',
        lastName: 'E2E',
      })
      .expect(201);

    const body = res.body as AuthResponseBody;
    expect(body.accessToken).toEqual(expect.any(String));
    expect(body.refreshToken).toBeUndefined();

    const setCookie = (res.headers['set-cookie'] as unknown as string[])[0];
    expect(setCookie).toContain('refresh_token=');
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/Path=\/auth/i);
    expect(setCookie).toMatch(/SameSite=Lax/i);
  });

  it("refresh: fonctionne via le cookie, fait tourner le jeton (l'ancien devient invalide)", async () => {
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        tenantName: 'Cookie E2E Co 2',
        email: `rotate-${email}`,
        password: 'cookiee2epass123',
        firstName: 'Cookie',
        lastName: 'E2E',
      });
    const originalToken = extractCookie(registerRes, 'refresh_token');
    expect(originalToken).toBeDefined();

    const refreshRes = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', `refresh_token=${originalToken}`)
      .expect(200);

    const refreshBody = refreshRes.body as AuthResponseBody;
    expect(refreshBody.accessToken).toEqual(expect.any(String));
    expect(refreshBody.refreshToken).toBeUndefined();
    const rotatedToken = extractCookie(refreshRes, 'refresh_token');
    expect(rotatedToken).toBeDefined();
    expect(rotatedToken).not.toEqual(originalToken);

    // L'ancien jeton (avant rotation) doit maintenant etre rejete.
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', `refresh_token=${originalToken}`)
      .expect(401);
  });

  it('refresh sans cookie : 401', () => {
    return request(app.getHttpServer()).post('/auth/refresh').expect(401);
  });

  it('logout : efface le cookie et revoque le jeton en base', async () => {
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        tenantName: 'Cookie E2E Co 3',
        email: `logout-${email}`,
        password: 'cookiee2epass123',
        firstName: 'Cookie',
        lastName: 'E2E',
      });
    const token = extractCookie(registerRes, 'refresh_token');

    const logoutRes = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', `refresh_token=${token}`)
      .expect(204);

    const clearedCookie = (
      logoutRes.headers['set-cookie'] as unknown as string[]
    )[0];
    expect(clearedCookie).toMatch(/refresh_token=;/);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', `refresh_token=${token}`)
      .expect(401);
  });
});

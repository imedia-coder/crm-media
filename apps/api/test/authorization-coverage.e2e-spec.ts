import { PATH_METADATA } from '@nestjs/common/constants';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './../src/app.module';
import { AUTHENTICATED_ONLY_KEY } from './../src/core/auth/decorators/authenticated-only.decorator';
import { IS_PUBLIC_KEY } from './../src/core/auth/decorators/public.decorator';
import { PERMISSIONS_KEY } from './../src/core/auth/decorators/permissions.decorator';

/**
 * PermissionsGuard laisse volontairement passer une route qui ne porte ni
 * @RequirePermissions() ni @Public() (voir son commentaire) — fail-open par
 * design, pour ne jamais bloquer une route legitime par erreur de config.
 * Ce test est le filet de securite en face : il echoue si un futur endpoint
 * est ajoute sans l'un de @Public(), @RequirePermissions() ou
 * @AuthenticatedOnly() (pour les endpoints "self-service" qui n'ont
 * legitimement besoin que d'etre authentifie — voir mfa/notifications/me),
 * plutot que de laisser passer un oubli en silence jusqu'a ce que quelqu'un
 * s'en aperçoive en prod.
 *
 * Un controleur qui protege autrement (ex. un @UseGuards() dedie comme
 * ClientPortalGuard) doit etre explicitement ajoute a EXEMPT_CONTROLLERS
 * ci-dessous plutot que de faire echouer ce test.
 */
const EXEMPT_CONTROLLERS: string[] = [];

describe('Authorization coverage (e2e)', () => {
  it('every route handler declares @Public() or @RequirePermissions()', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const discovery = moduleFixture.get(DiscoveryService);
    const scanner = new MetadataScanner();
    const reflector = moduleFixture.get(Reflector);

    const gaps: string[] = [];

    for (const wrapper of discovery.getControllers()) {
      const instance = wrapper.instance as object | null;
      if (!instance) continue;
      const constructorName = instance.constructor.name;
      if (EXEMPT_CONTROLLERS.includes(constructorName)) continue;

      const prototype = Object.getPrototypeOf(instance) as object;
      for (const methodName of scanner.getAllMethodNames(prototype)) {
        const handler = (prototype as Record<string, () => unknown>)[
          methodName
        ];
        // Seules les vraies methodes de route ont PATH_METADATA (pose par
        // @Get/@Post/... ) — un helper prive sur le controleur n'en a pas.
        if (Reflect.getMetadata(PATH_METADATA, handler) === undefined) {
          continue;
        }

        const isPublic: boolean | undefined = reflector.getAllAndOverride(
          IS_PUBLIC_KEY,
          [handler, instance.constructor],
        );
        const permissions: string[] | undefined = reflector.getAllAndOverride(
          PERMISSIONS_KEY,
          [handler, instance.constructor],
        );
        const authenticatedOnly: boolean | undefined =
          reflector.getAllAndOverride(AUTHENTICATED_ONLY_KEY, [
            handler,
            instance.constructor,
          ]);

        if (
          isPublic ||
          authenticatedOnly ||
          (permissions && permissions.length > 0)
        ) {
          continue;
        }
        gaps.push(`${constructorName}.${methodName}`);
      }
    }

    expect(gaps).toEqual([]);
  });
});

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[![CI (api)](https://github.com/imedia-coder/crm-media/actions/workflows/api-ci.yml/badge.svg)](https://github.com/imedia-coder/crm-media/actions/workflows/api-ci.yml)

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## CI

`.github/workflows/api-ci.yml`, à la racine du monorepo, se déclenche à chaque push/pull request sur `main` touchant `apps/api/**` : vérification des types, **lint**, tests unitaires, migrations Prisma puis tests e2e — le tout contre un Postgres jetable (service Docker `postgres:16-alpine`), jamais la base Neon de production. Comme `prisma/migrations/20260723040000_app_runtime_role` ne fixe volontairement aucun mot de passe pour le rôle `app_runtime` (voir `.env.example`), la CI en définit un propre au job juste après les migrations.

**Lint** : `eslint` sans `--fix` (contrairement au script `lint` du `package.json`, pensé pour un usage local — la CI doit échouer sur un vrai problème, pas le corriger silencieusement). Remontait ~290 problèmes lors de la mise en place de la CI (voir plus bas), quasi tous du formatage Prettier jamais appliqué (pas une dérive CRLF/LF — `endOfLine: "auto"` est déjà configuré dans `eslint.config.mjs` — juste du code jamais passé par `--fix`) plus une poignée de vraies erreurs de règles (`.code` accédé sur une valeur `any` dans plusieurs `catch`, `Promise.all` mélangeant une valeur synchrone, `no-empty-object-type` mal désactivé, promesse flottante dans `main.ts`, retour `any` non typé). Corrigés (formatage + erreurs), sauf 3 fichiers (`storage.service.ts`, `ai.controller.ts`, `ai.service.ts`) volontairement exclus de la vérification CI et pas retouchés : ils étaient activement modifiés par un autre chantier en cours au moment de ce nettoyage, et les toucher aurait pollué ce travail non lié. Ajouté aussi `@typescript-eslint/no-unused-vars` avec `argsIgnorePattern`/`varsIgnorePattern: '^_'`, pour la convention déjà utilisée dans le code (`const { secret: _secret, ...rest } = x` pour exclure un champ sensible d'un DTO). 2 warnings `no-unsafe-argument` subsistent, déjà configurés non-bloquants.

Vérifié après coup : `tsc --noEmit`, `jest` et les tests e2e (migrations + rôle `app_runtime` jetable) tous verts, comportement strictement inchangé.

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

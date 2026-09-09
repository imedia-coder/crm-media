# teleprompt

[![CI (teleprompt)](https://github.com/imedia-coder/crm-media/actions/workflows/teleprompt-ci.yml/badge.svg)](https://github.com/imedia-coder/crm-media/actions/workflows/teleprompt-ci.yml)

Application Next.js de téléprompteur (édition de script, prompteur avec enregistrement vidéo). Fait partie du monorepo `crm-media` (Turborepo + pnpm workspaces).

## Démarrage

Depuis la racine du monorepo :

```bash
pnpm install
pnpm --filter teleprompt dev
```

Ouvre [http://localhost:3100](http://localhost:3100).

## CI

`.github/workflows/teleprompt-ci.yml`, à la racine du monorepo, se déclenche à chaque push/pull request sur `main` touchant `apps/teleprompt/**` : vérification des types (`tsc --noEmit`), lint (`eslint`) et build (`next build`). Pas de suite de tests automatisés pour l'instant.

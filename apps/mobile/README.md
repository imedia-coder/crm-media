# teleprompt_mobile

[![CI (mobile)](https://github.com/imedia-coder/crm-media/actions/workflows/mobile-ci.yml/badge.svg)](https://github.com/imedia-coder/crm-media/actions/workflows/mobile-ci.yml)

A new Flutter project.

## CI

`.github/workflows/mobile-ci.yml`, à la racine du monorepo, se déclenche à chaque push/pull request sur `main` touchant `apps/mobile/**` : `flutter analyze --no-fatal-infos` puis `flutter test`. Les tests montent l'app via `sqflite_common_ffi` (voir `test/widget_test.dart`) — sqflite n'a pas d'implémentation utilisable dans l'environnement de test.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Learn Flutter](https://docs.flutter.dev/get-started/learn-flutter)
- [Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Flutter learning resources](https://docs.flutter.dev/reference/learning-resources)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.

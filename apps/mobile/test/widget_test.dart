import 'package:flutter_test/flutter_test.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

import 'package:teleprompt_mobile/main.dart';

void main() {
  // sqflite n'a pas d'implementation utilisable dans l'environnement de test
  // (pas de canal de plateforme) — l'app touche la base des le premier
  // ecran (DashboardScreen.initState -> ScriptRepository.listScripts),
  // donc sans ce factory tout test qui monte l'app plante avec
  // "databaseFactory not initialized".
  setUpAll(() {
    sqfliteFfiInit();
    databaseFactory = databaseFactoryFfi;
  });

  testWidgets('Dashboard loads with the app title', (WidgetTester tester) async {
    await tester.pumpWidget(const TelePromptApp());
    await tester.pump();

    expect(find.text('TelePrompt'), findsOneWidget);
    expect(find.text('Nouveau script'), findsOneWidget);
  });
}

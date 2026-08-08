import 'package:flutter_test/flutter_test.dart';

import 'package:teleprompt_mobile/main.dart';

void main() {
  testWidgets('Dashboard loads with the app title', (WidgetTester tester) async {
    await tester.pumpWidget(const TelePromptApp());
    await tester.pump();

    expect(find.text('TelePrompt'), findsOneWidget);
    expect(find.text('Nouveau script'), findsOneWidget);
  });
}

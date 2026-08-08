import 'package:flutter/material.dart';

import 'screens/dashboard_screen.dart';
import 'screens/editor_screen.dart';
import 'screens/prompter_screen.dart';
import 'screens/videos_screen.dart';

void main() {
  runApp(const TelePromptApp());
}

// Design tokens mirrored from apps/teleprompt/src/app/globals.css so both
// clients read as one product.
const kBackground = Color(0xFF0A0A0F);
const kCard = Color(0xFF15151D);
const kPrimary = Color(0xFF7C5CFF);
const kMuted = Color(0xFF9797A8);
const kBorder = Color(0xFF26262F);

class TelePromptApp extends StatelessWidget {
  const TelePromptApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TelePrompt',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: kBackground,
        colorScheme: const ColorScheme.dark(
          primary: kPrimary,
          surface: kCard,
          onSurface: Colors.white,
        ),
        cardColor: kCard,
        dividerColor: kBorder,
        appBarTheme: const AppBarTheme(
          backgroundColor: kBackground,
          elevation: 0,
          foregroundColor: Colors.white,
        ),
        textTheme: Typography.whiteMountainView,
      ),
      initialRoute: '/',
      onGenerateRoute: (settings) {
        switch (settings.name) {
          case '/':
            return MaterialPageRoute(builder: (_) => const DashboardScreen());
          case '/editor':
            return MaterialPageRoute(
              builder: (_) => EditorScreen(scriptId: settings.arguments as String),
            );
          case '/prompter':
            return MaterialPageRoute(
              builder: (_) => PrompterScreen(scriptId: settings.arguments as String),
            );
          case '/videos':
            return MaterialPageRoute(builder: (_) => const VideosScreen());
          default:
            return MaterialPageRoute(builder: (_) => const DashboardScreen());
        }
      },
    );
  }
}

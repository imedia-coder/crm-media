// Debug-only entry point used by the Codemagic simulator diagnostic
// workflow: seeds a script and opens the prompter directly, so a CI run can
// screenshot it without needing UI automation to navigate there. Not part
// of the shipped app — run with `flutter run -t lib/main_debug_prompter.dart`.
import 'package:flutter/material.dart';

import 'data/script_repository.dart';
import 'main.dart';
import 'screens/prompter_screen.dart';

void main() {
  runApp(const _DebugPrompterApp());
}

class _DebugPrompterApp extends StatelessWidget {
  const _DebugPrompterApp();

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TelePrompt Debug',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: kBackground,
        colorScheme: const ColorScheme.dark(primary: kPrimary, surface: kCard, onSurface: Colors.white),
      ),
      home: const _SeedAndOpenPrompter(),
    );
  }
}

class _SeedAndOpenPrompter extends StatefulWidget {
  const _SeedAndOpenPrompter();

  @override
  State<_SeedAndOpenPrompter> createState() => _SeedAndOpenPrompterState();
}

class _SeedAndOpenPrompterState extends State<_SeedAndOpenPrompter> {
  @override
  void initState() {
    super.initState();
    _seedAndNavigate();
  }

  Future<void> _seedAndNavigate() async {
    final script = await ScriptRepository.instance.createScript(
      title: 'Script de diagnostic',
      content:
          "Bonjour et bienvenue dans cette demonstration.\n\n"
          "Ceci est un script de test pour verifier que le texte du "
          "teleprompteur s'affiche correctement sur iOS.\n\n"
          "Si vous voyez ce texte, l'affichage fonctionne comme prevu.",
    );
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => PrompterScreen(scriptId: script.id)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: kBackground,
      body: Center(child: CircularProgressIndicator()),
    );
  }
}

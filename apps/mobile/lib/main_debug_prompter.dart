// Debug-only entry point used by the Codemagic simulator diagnostic
// workflow. Renders several isolated test sections stacked vertically so a
// single screenshot gives a clean bisection signal for the "invisible text
// on iOS" bug, without navigating through any of the real app's stateful
// screens (PrompterScreen, camera, gestures, etc.) that could be masking
// where the problem actually is.
import 'package:flutter/material.dart';

import 'models/script_settings.dart';
import 'widgets/teleprompter_text.dart';

void main() {
  runApp(const _DiagnosticApp());
}

class _DiagnosticApp extends StatelessWidget {
  const _DiagnosticApp();

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      title: 'TelePrompt Diagnostic',
      debugShowCheckedModeBanner: false,
      home: _DiagnosticScreen(),
    );
  }
}

class _DiagnosticScreen extends StatelessWidget {
  const _DiagnosticScreen();

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    final settings = const ScriptSettings(scriptId: 'debug');
    final contentKey = GlobalKey();

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Section A: absolute baseline — plain black Container + white
            // Text, nothing else involved.
            Container(
              height: 100,
              color: Colors.black,
              alignment: Alignment.center,
              child: const Text(
                'SECTION A - PLAIN BLACK+WHITE TEXT',
                style: TextStyle(color: Colors.white, fontSize: 14),
              ),
            ),
            // MediaQuery diagnostics.
            Container(
              color: Colors.blueGrey,
              padding: const EdgeInsets.all(8),
              child: Text(
                'size=${mq.size} devicePixelRatio=${mq.devicePixelRatio} '
                'padding=${mq.padding} viewInsets=${mq.viewInsets} '
                'viewPadding=${mq.viewPadding}',
                style: const TextStyle(color: Colors.white, fontSize: 11),
              ),
            ),
            // Section B: the actual TeleprompterText widget, with hardcoded
            // values and no dependency on async-loaded state.
            SizedBox(
              height: 300,
              child: Stack(
                children: [
                  Positioned.fill(
                    child: Container(color: Colors.yellow),
                  ),
                  TeleprompterText(
                    content: 'SECTION B - VIA TELEPROMPTERTEXT WIDGET\n\nSecond line here.',
                    settings: settings,
                    paddingTop: 20,
                    paddingBottom: 20,
                    position: 0,
                    contentKey: contentKey,
                    maxWidth: mq.size.width * 0.85,
                  ),
                ],
              ),
            ),
            // Section C: manual replica of TeleprompterText's structure,
            // inline, to compare directly against Section B.
            Expanded(
              child: Container(
                color: Colors.black,
                width: double.infinity,
                child: Stack(
                  children: [
                    Positioned.fill(child: Container(color: Colors.green)),
                    const Positioned(
                      top: 20,
                      left: 0,
                      right: 0,
                      child: Center(
                        child: Text(
                          'SECTION C - MANUAL REPLICA',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 32,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

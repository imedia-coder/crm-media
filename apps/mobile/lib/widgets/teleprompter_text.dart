import 'package:flutter/material.dart';

import '../models/script_settings.dart';

class TeleprompterText extends StatelessWidget {
  const TeleprompterText({
    super.key,
    required this.content,
    required this.settings,
    required this.paddingTop,
    required this.paddingBottom,
    required this.position,
    required this.contentKey,
    required this.maxWidth,
  });

  final String content;
  final ScriptSettings settings;
  final double paddingTop;
  final double paddingBottom;
  final double position;
  final GlobalKey contentKey;
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    final colors = themeColorsFor(settings);
    final paragraphs = content.split('\n');

    Widget textColumn = Container(
      key: contentKey,
      width: maxWidth,
      padding: EdgeInsets.only(top: paddingTop, bottom: paddingBottom),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: paragraphs
            .map(
              (line) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Text(
                  line.isEmpty ? ' ' : line,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: colors.foreground,
                    fontSize: settings.fontSize,
                    height: settings.lineHeight,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            )
            .toList(),
      ),
    );

    if (settings.mirrorMode) {
      textColumn = Transform(
        alignment: Alignment.center,
        transform: Matrix4.diagonal3Values(-1.0, 1.0, 1.0),
        child: textColumn,
      );
    }

    return Container(
      color: colors.background,
      width: double.infinity,
      height: double.infinity,
      child: ClipRect(
        child: Transform.translate(
          offset: Offset(0, -position),
          child: Align(
            alignment: Alignment.topCenter,
            child: textColumn,
          ),
        ),
      ),
    );
  }
}

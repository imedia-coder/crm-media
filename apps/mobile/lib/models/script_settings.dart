import 'package:flutter/material.dart';

enum ColorTheme { classic, yellow, light, custom }

class ScriptSettings {
  final String scriptId;
  final double fontSize;
  final double lineHeight;
  final double textWidth;
  final ColorTheme colorTheme;
  final int customBackground;
  final int customForeground;
  final double scrollSpeed;
  final bool mirrorMode;
  final bool markerEnabled;
  final int countdownSeconds;

  const ScriptSettings({
    required this.scriptId,
    this.fontSize = 40,
    this.lineHeight = 1.5,
    this.textWidth = 0.85,
    this.colorTheme = ColorTheme.classic,
    this.customBackground = 0xFF000000,
    this.customForeground = 0xFF7C5CFF,
    this.scrollSpeed = 1,
    this.mirrorMode = false,
    this.markerEnabled = true,
    this.countdownSeconds = 3,
  });

  ScriptSettings copyWith({
    double? fontSize,
    double? lineHeight,
    double? textWidth,
    ColorTheme? colorTheme,
    int? customBackground,
    int? customForeground,
    double? scrollSpeed,
    bool? mirrorMode,
    bool? markerEnabled,
    int? countdownSeconds,
  }) {
    return ScriptSettings(
      scriptId: scriptId,
      fontSize: fontSize ?? this.fontSize,
      lineHeight: lineHeight ?? this.lineHeight,
      textWidth: textWidth ?? this.textWidth,
      colorTheme: colorTheme ?? this.colorTheme,
      customBackground: customBackground ?? this.customBackground,
      customForeground: customForeground ?? this.customForeground,
      scrollSpeed: scrollSpeed ?? this.scrollSpeed,
      mirrorMode: mirrorMode ?? this.mirrorMode,
      markerEnabled: markerEnabled ?? this.markerEnabled,
      countdownSeconds: countdownSeconds ?? this.countdownSeconds,
    );
  }

  Map<String, Object?> toMap() => {
        'scriptId': scriptId,
        'fontSize': fontSize,
        'lineHeight': lineHeight,
        'textWidth': textWidth,
        'colorTheme': colorTheme.name,
        'customBackground': customBackground,
        'customForeground': customForeground,
        'scrollSpeed': scrollSpeed,
        'mirrorMode': mirrorMode ? 1 : 0,
        'markerEnabled': markerEnabled ? 1 : 0,
        'countdownSeconds': countdownSeconds,
      };

  factory ScriptSettings.fromMap(Map<String, Object?> map) => ScriptSettings(
        scriptId: map['scriptId'] as String,
        fontSize: (map['fontSize'] as num).toDouble(),
        lineHeight: (map['lineHeight'] as num).toDouble(),
        textWidth: (map['textWidth'] as num).toDouble(),
        colorTheme: ColorTheme.values.firstWhere(
          (t) => t.name == map['colorTheme'],
          orElse: () => ColorTheme.classic,
        ),
        customBackground: map['customBackground'] as int,
        customForeground: map['customForeground'] as int,
        scrollSpeed: (map['scrollSpeed'] as num).toDouble(),
        mirrorMode: (map['mirrorMode'] as int) == 1,
        markerEnabled: (map['markerEnabled'] as int) == 1,
        countdownSeconds: map['countdownSeconds'] as int,
      );
}

class ThemeColors {
  final Color background;
  final Color foreground;
  const ThemeColors(this.background, this.foreground);
}

ThemeColors themeColorsFor(ScriptSettings settings) {
  switch (settings.colorTheme) {
    case ColorTheme.classic:
      return const ThemeColors(Colors.black, Colors.white);
    case ColorTheme.yellow:
      return const ThemeColors(Colors.black, Color(0xFFFFDE59));
    case ColorTheme.light:
      return const ThemeColors(Colors.white, Color(0xFF0A0A0A));
    case ColorTheme.custom:
      return ThemeColors(
        Color(settings.customBackground),
        Color(settings.customForeground),
      );
  }
}

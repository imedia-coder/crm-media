import 'package:flutter/material.dart';

import '../main.dart';
import '../models/script_settings.dart';

const _fontSizes = [24.0, 32.0, 40.0, 48.0, 56.0, 64.0, 72.0];
const _countdowns = [0, 3, 5, 10];

Future<void> showSettingsSheet({
  required BuildContext context,
  required ScriptSettings settings,
  required void Function(ScriptSettings) onChange,
}) {
  return showModalBottomSheet(
    context: context,
    backgroundColor: kCard,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ),
    builder: (context) {
      return StatefulBuilder(
        builder: (context, setSheetState) {
          void update(ScriptSettings next) {
            onChange(next);
            setSheetState(() {});
          }

          return DraggableScrollableSheet(
            initialChildSize: 0.75,
            minChildSize: 0.4,
            maxChildSize: 0.95,
            expand: false,
            builder: (context, scrollController) {
              return ListView(
                controller: scrollController,
                padding: const EdgeInsets.all(20),
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Réglages',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Fermer'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Text('Taille du texte', style: TextStyle(color: kMuted)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: _fontSizes
                        .map((size) => ChoiceChip(
                              label: Text('${size.toInt()}'),
                              selected: settings.fontSize == size,
                              onSelected: (_) => update(settings.copyWith(fontSize: size)),
                            ))
                        .toList(),
                  ),
                  const SizedBox(height: 20),
                  const Text('Couleurs', style: TextStyle(color: kMuted)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _themeChip('Classique', ColorTheme.classic, settings, update),
                      _themeChip('Jaune', ColorTheme.yellow, settings, update),
                      _themeChip('Clair', ColorTheme.light, settings, update),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Text('Largeur du texte (${(settings.textWidth * 100).round()}%)',
                      style: const TextStyle(color: kMuted)),
                  Slider(
                    value: settings.textWidth,
                    min: 0.4,
                    max: 1.0,
                    activeColor: kPrimary,
                    onChanged: (v) => update(settings.copyWith(textWidth: v)),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Mode miroir'),
                      Switch(
                        value: settings.mirrorMode,
                        activeThumbColor: kPrimary,
                        onChanged: (v) => update(settings.copyWith(mirrorMode: v)),
                      ),
                    ],
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Marqueur central'),
                      Switch(
                        value: settings.markerEnabled,
                        activeThumbColor: kPrimary,
                        onChanged: (v) => update(settings.copyWith(markerEnabled: v)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text('Compte à rebours (enregistrement)',
                      style: TextStyle(color: kMuted)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: _countdowns
                        .map((s) => ChoiceChip(
                              label: Text(s == 0 ? 'Désactivé' : '${s}s'),
                              selected: settings.countdownSeconds == s,
                              onSelected: (_) =>
                                  update(settings.copyWith(countdownSeconds: s)),
                            ))
                        .toList(),
                  ),
                  const SizedBox(height: 20),
                ],
              );
            },
          );
        },
      );
    },
  );
}

Widget _themeChip(
  String label,
  ColorTheme theme,
  ScriptSettings settings,
  void Function(ScriptSettings) update,
) {
  return ChoiceChip(
    label: Text(label),
    selected: settings.colorTheme == theme,
    onSelected: (_) => update(settings.copyWith(colorTheme: theme)),
  );
}

import 'dart:async';

import 'package:flutter/material.dart';

import '../data/script_repository.dart';
import '../main.dart';
import '../models/script.dart';

class EditorScreen extends StatefulWidget {
  const EditorScreen({super.key, required this.scriptId});

  final String scriptId;

  @override
  State<EditorScreen> createState() => _EditorScreenState();
}

class _EditorScreenState extends State<EditorScreen> {
  Script? _script;
  bool _notFound = false;
  bool _saving = false;
  DateTime? _savedAt;
  Timer? _debounce;

  final _titleController = TextEditingController();
  final _contentController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final script = await ScriptRepository.instance.getScript(widget.scriptId);
    if (!mounted) return;
    if (script == null) {
      setState(() => _notFound = true);
      return;
    }
    _titleController.text = script.title;
    _contentController.text = script.content;
    setState(() {
      _script = script;
      _savedAt = DateTime.fromMillisecondsSinceEpoch(script.updatedAt);
    });
  }

  void _onChanged() {
    final current = _script;
    if (current == null) return;
    setState(() {
      _script = current.copyWith(
        title: _titleController.text,
        content: _contentController.text,
      );
    });
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 600), _save);
  }

  Future<void> _save() async {
    final current = _script;
    if (current == null) return;
    setState(() => _saving = true);
    await ScriptRepository.instance.saveScript(current);
    if (!mounted) return;
    setState(() {
      _saving = false;
      _savedAt = DateTime.now();
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _titleController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_notFound) {
      return Scaffold(
        body: Center(
          child: TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Script introuvable · Retour'),
          ),
        ),
      );
    }
    final script = _script;
    if (script == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final words = countWords(script.content);
    final duration = estimateDurationSeconds(script.content, script.wordsPerMinute);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          _saving ? 'Sauvegarde…' : (_savedAt != null ? 'Sauvegardé automatiquement' : ''),
          style: const TextStyle(fontSize: 13, color: kMuted),
        ),
        centerTitle: true,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: FilledButton.icon(
              style: FilledButton.styleFrom(backgroundColor: kPrimary),
              onPressed: () => Navigator.pushNamed(context, '/prompter', arguments: script.id),
              icon: const Icon(Icons.play_arrow, size: 18),
              label: const Text('Lancer'),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(
                controller: _titleController,
                onChanged: (_) => _onChanged(),
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                decoration: const InputDecoration(
                  hintText: 'Titre',
                  hintStyle: TextStyle(color: kMuted),
                  border: InputBorder.none,
                ),
              ),
              Expanded(
                child: TextField(
                  controller: _contentController,
                  onChanged: (_) => _onChanged(),
                  maxLines: null,
                  expands: true,
                  textAlignVertical: TextAlignVertical.top,
                  style: const TextStyle(fontSize: 17, height: 1.5),
                  decoration: const InputDecoration(
                    hintText: 'Bonjour et bienvenue…',
                    hintStyle: TextStyle(color: kMuted),
                    border: InputBorder.none,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: const BoxDecoration(
                  border: Border(top: BorderSide(color: kBorder)),
                ),
                child: Row(
                  children: [
                    Text('$words mots', style: const TextStyle(color: kMuted)),
                    const SizedBox(width: 16),
                    Text(formatDuration(duration), style: const TextStyle(color: kMuted)),
                    const Spacer(),
                    DropdownButton<int>(
                      value: script.wordsPerMinute,
                      dropdownColor: kCard,
                      underline: const SizedBox(),
                      items: wpmOptions
                          .map((wpm) => DropdownMenuItem(
                                value: wpm,
                                child: Text('$wpm mots/min'),
                              ))
                          .toList(),
                      onChanged: (value) {
                        if (value == null) return;
                        setState(() => _script = script.copyWith(wordsPerMinute: value));
                        _debounce?.cancel();
                        _debounce = Timer(const Duration(milliseconds: 200), _save);
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

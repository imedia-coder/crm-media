import 'package:flutter/material.dart';

import '../data/script_repository.dart';
import '../main.dart';
import '../models/script.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<Script>? _scripts;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final scripts = await ScriptRepository.instance.listScripts();
    if (mounted) setState(() => _scripts = scripts);
  }

  Future<void> _createScript() async {
    final script = await ScriptRepository.instance.createScript();
    if (!mounted) return;
    await Navigator.pushNamed(context, '/editor', arguments: script.id);
    _load();
  }

  Future<void> _deleteScript(Script script) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: kCard,
        title: const Text('Supprimer ce script ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await ScriptRepository.instance.deleteScript(script.id);
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    final scripts = _scripts;
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 28,
              height: 28,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: kPrimary,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text('T', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
            const SizedBox(width: 10),
            const Text('TelePrompt', style: TextStyle(fontWeight: FontWeight.w600)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.video_library_outlined),
            tooltip: 'Mes vidéos',
            onPressed: () => Navigator.pushNamed(context, '/videos'),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Bonjour',
                  style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              const Text(
                'Écrivez un script, réglez le défilement, enregistrez.',
                style: TextStyle(color: kMuted),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  style: FilledButton.styleFrom(
                    backgroundColor: kPrimary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  onPressed: _createScript,
                  icon: const Icon(Icons.add),
                  label: const Text('Nouveau script'),
                ),
              ),
              const SizedBox(height: 28),
              const Text('Scripts récents',
                  style: TextStyle(color: kMuted, fontWeight: FontWeight.w500)),
              const SizedBox(height: 10),
              Expanded(
                child: scripts == null
                    ? const Center(child: CircularProgressIndicator())
                    : scripts.isEmpty
                        ? const Center(
                            child: Text(
                              "Aucun script pour l'instant.",
                              style: TextStyle(color: kMuted),
                            ),
                          )
                        : ListView.separated(
                            itemCount: scripts.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (context, i) {
                              final script = scripts[i];
                              final words = countWords(script.content);
                              final duration = estimateDurationSeconds(
                                  script.content, script.wordsPerMinute);
                              return Material(
                                color: kCard,
                                borderRadius: BorderRadius.circular(12),
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(12),
                                  onTap: () async {
                                    await Navigator.pushNamed(context, '/editor',
                                        arguments: script.id);
                                    _load();
                                  },
                                  child: Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Row(
                                      children: [
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(script.title,
                                                  style: const TextStyle(
                                                      fontWeight: FontWeight.w600)),
                                              const SizedBox(height: 4),
                                              Text(
                                                '$words mots · ${formatDuration(duration)}',
                                                style: const TextStyle(
                                                    color: kMuted, fontSize: 13),
                                              ),
                                            ],
                                          ),
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.delete_outline,
                                              color: kMuted),
                                          onPressed: () => _deleteScript(script),
                                        ),
                                        IconButton.filled(
                                          style: IconButton.styleFrom(
                                              backgroundColor: kPrimary),
                                          icon: const Icon(Icons.play_arrow),
                                          onPressed: () => Navigator.pushNamed(
                                              context, '/prompter',
                                              arguments: script.id),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

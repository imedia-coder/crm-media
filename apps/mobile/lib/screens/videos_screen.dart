import 'dart:io';

import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

import '../data/script_repository.dart';
import '../main.dart';
import '../models/recording.dart';
import '../models/script.dart';

class VideosScreen extends StatefulWidget {
  const VideosScreen({super.key});

  @override
  State<VideosScreen> createState() => _VideosScreenState();
}

class _VideosScreenState extends State<VideosScreen> {
  List<Recording>? _recordings;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final recordings = await ScriptRepository.instance.listRecordings();
    if (mounted) setState(() => _recordings = recordings);
  }

  Future<void> _delete(Recording recording) async {
    await ScriptRepository.instance.deleteRecording(recording.id);
    final file = File(recording.filePath);
    if (await file.exists()) await file.delete();
    _load();
  }

  Future<void> _rename(Recording recording) async {
    final controller = TextEditingController(text: recording.title);
    final title = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: kCard,
        title: const Text('Renommer'),
        content: TextField(controller: controller, autofocus: true),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, controller.text),
            child: const Text('Enregistrer'),
          ),
        ],
      ),
    );
    if (title != null && title.trim().isNotEmpty) {
      await ScriptRepository.instance.renameRecording(recording.id, title.trim());
      _load();
    }
  }

  void _play(Recording recording) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => _VideoPlayerScreen(recording: recording)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final recordings = _recordings;
    return Scaffold(
      appBar: AppBar(title: const Text('Mes vidéos')),
      body: SafeArea(
        child: recordings == null
            ? const Center(child: CircularProgressIndicator())
            : recordings.isEmpty
                ? const Center(
                    child: Text(
                      'Aucune vidéo enregistrée pour l\'instant.',
                      style: TextStyle(color: kMuted),
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(20),
                    itemCount: recordings.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, i) {
                      final recording = recordings[i];
                      return Material(
                        color: kCard,
                        borderRadius: BorderRadius.circular(12),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () => _play(recording),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(recording.title,
                                          style: const TextStyle(fontWeight: FontWeight.w600)),
                                      const SizedBox(height: 4),
                                      Text(
                                        '${formatDuration(recording.durationSeconds)} · ${recording.resolution}',
                                        style: const TextStyle(color: kMuted, fontSize: 13),
                                      ),
                                    ],
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.edit_outlined, color: kMuted),
                                  onPressed: () => _rename(recording),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, color: kMuted),
                                  onPressed: () => _delete(recording),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}

class _VideoPlayerScreen extends StatefulWidget {
  const _VideoPlayerScreen({required this.recording});
  final Recording recording;

  @override
  State<_VideoPlayerScreen> createState() => _VideoPlayerScreenState();
}

class _VideoPlayerScreenState extends State<_VideoPlayerScreen> {
  late final VideoPlayerController _controller;

  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.file(File(widget.recording.filePath))
      ..initialize().then((_) {
        setState(() {});
        _controller.play();
      });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(backgroundColor: Colors.black, title: Text(widget.recording.title)),
      body: Center(
        child: _controller.value.isInitialized
            ? AspectRatio(
                aspectRatio: _controller.value.aspectRatio,
                child: VideoPlayer(_controller),
              )
            : const CircularProgressIndicator(),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: kPrimary,
        onPressed: () => setState(() {
          _controller.value.isPlaying ? _controller.pause() : _controller.play();
        }),
        child: Icon(_controller.value.isPlaying ? Icons.pause : Icons.play_arrow),
      ),
    );
  }
}

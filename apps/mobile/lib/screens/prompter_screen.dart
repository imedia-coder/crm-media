import 'dart:async';
import 'dart:io';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

import '../core/scroll_engine.dart';
import '../data/script_repository.dart';
import '../main.dart';
import '../models/script.dart';
import '../models/script_settings.dart';
import '../widgets/settings_sheet.dart';
import '../widgets/teleprompter_text.dart';

enum _RecState { idle, countdown, recording, paused, finished }

class PrompterScreen extends StatefulWidget {
  const PrompterScreen({super.key, required this.scriptId});
  final String scriptId;

  @override
  State<PrompterScreen> createState() => _PrompterScreenState();
}

class _PrompterScreenState extends State<PrompterScreen>
    with SingleTickerProviderStateMixin {
  Script? _script;
  ScriptSettings? _settings;
  late final ScrollEngine _engine;
  double _position = 0;
  bool _playing = false;
  bool _controlsVisible = true;
  Timer? _hideTimer;

  final _contentKey = GlobalKey();
  double _viewportHeight = 0;

  bool _studioMode = false;
  CameraController? _camera;
  _RecState _recState = _RecState.idle;
  int _countdownValue = 0;
  double _recordingSeconds = 0;
  Timer? _recordingTimer;
  String? _finishedVideoPath;

  Offset? _dragStart;

  @override
  void initState() {
    super.initState();
    _engine = ScrollEngine(
      vsync: this,
      baseRate: 40,
      onUpdate: (p) => setState(() => _position = p),
      onEnd: () => setState(() => _playing = false),
    );
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    WakelockPlus.enable();
    _load();
    _revealControls();
  }

  Future<void> _load() async {
    final script = await ScriptRepository.instance.getScript(widget.scriptId);
    if (script == null || !mounted) return;
    final settings = await ScriptRepository.instance.getSettings(widget.scriptId);
    if (!mounted) return;
    setState(() {
      _script = script;
      _settings = settings;
    });
    _engine.setSpeed(settings.scrollSpeed);
    WidgetsBinding.instance.addPostFrameCallback((_) => _recomputeMetrics());
  }

  void _recomputeMetrics() {
    final script = _script;
    final settings = _settings;
    final box = _contentKey.currentContext?.findRenderObject() as RenderBox?;
    if (script == null || settings == null || box == null) return;
    final contentHeight = box.size.height;
    final maxPosition = (contentHeight - _viewportHeight).clamp(0, double.infinity).toDouble();
    _engine.setMaxPosition(maxPosition);
    final durationSeconds = estimateDurationSeconds(script.content, script.wordsPerMinute);
    final baseRate =
        durationSeconds > 0 ? maxPosition / durationSeconds : settings.fontSize * 0.9;
    _engine.setBaseRate(baseRate > 0 ? baseRate : settings.fontSize * 0.9);
  }

  void _updateSettings(ScriptSettings next) {
    setState(() => _settings = next);
    ScriptRepository.instance.saveSettings(next);
    _engine.setSpeed(next.scrollSpeed);
    WidgetsBinding.instance.addPostFrameCallback((_) => _recomputeMetrics());
  }

  void _revealControls() {
    setState(() => _controlsVisible = true);
    _hideTimer?.cancel();
    _hideTimer = Timer(const Duration(seconds: 3), () {
      if (_playing && mounted) setState(() => _controlsVisible = false);
    });
  }

  void _togglePlay() {
    _engine.toggle();
    setState(() => _playing = _engine.isPlaying);
    _revealControls();
  }

  void _seekRelative(double deltaSeconds) {
    _engine.nudge(deltaSeconds * _engine.baseRate * _engine.speed);
  }

  void _toggleMirror() {
    final s = _settings;
    if (s == null) return;
    _updateSettings(s.copyWith(mirrorMode: !s.mirrorMode));
  }

  Future<void> _toggleStudio() async {
    if (_studioMode) {
      await _camera?.dispose();
      setState(() {
        _camera = null;
        _studioMode = false;
      });
      return;
    }
    final cam = await Permission.camera.request();
    final mic = await Permission.microphone.request();
    if (!cam.isGranted || !mic.isGranted) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text(
            "Pour enregistrer votre vidéo, l'application a besoin d'accéder à votre caméra et à votre microphone.",
          ),
        ));
      }
      return;
    }
    final cameras = await availableCameras();
    if (cameras.isEmpty) return;
    final front = cameras.firstWhere(
      (c) => c.lensDirection == CameraLensDirection.front,
      orElse: () => cameras.first,
    );
    final controller = CameraController(front, ResolutionPreset.high, enableAudio: true);
    await controller.initialize();
    if (!mounted) return;
    setState(() {
      _camera = controller;
      _studioMode = true;
    });
  }

  Future<void> _startCountdown() async {
    final settings = _settings;
    if (settings == null || _camera == null) return;
    final seconds = settings.countdownSeconds;
    if (seconds == 0) {
      await _beginRecording();
      return;
    }
    setState(() {
      _recState = _RecState.countdown;
      _countdownValue = seconds;
    });
    for (var i = seconds; i > 0; i--) {
      if (!mounted) return;
      setState(() => _countdownValue = i);
      await Future.delayed(const Duration(seconds: 1));
    }
    await _beginRecording();
  }

  Future<void> _beginRecording() async {
    if (_camera == null) return;
    await _camera!.startVideoRecording();
    if (!mounted) return;
    setState(() {
      _recState = _RecState.recording;
      _recordingSeconds = 0;
    });
    _recordingTimer = Timer.periodic(const Duration(milliseconds: 250), (_) {
      if (mounted) setState(() => _recordingSeconds += 0.25);
    });
    _engine.play();
    setState(() => _playing = true);
  }

  Future<void> _onRecordToggle() async {
    if (_recState == _RecState.idle) {
      await _startCountdown();
    } else if (_recState == _RecState.recording) {
      await _camera?.pauseVideoRecording();
      _engine.pause();
      setState(() {
        _playing = false;
        _recState = _RecState.paused;
      });
    } else if (_recState == _RecState.paused) {
      await _camera?.resumeVideoRecording();
      _engine.play();
      setState(() {
        _playing = true;
        _recState = _RecState.recording;
      });
    }
  }

  Future<void> _finishRecording() async {
    if (_camera == null) return;
    _recordingTimer?.cancel();
    final xfile = await _camera!.stopVideoRecording();
    final dir = await getApplicationDocumentsDirectory();
    final fileName = 'teleprompt_${DateTime.now().millisecondsSinceEpoch}.mp4';
    final savedPath = '${dir.path}/$fileName';
    await File(xfile.path).copy(savedPath);
    if (!mounted) return;
    setState(() {
      _finishedVideoPath = savedPath;
      _recState = _RecState.finished;
    });
    _engine.pause();
    setState(() => _playing = false);
  }

  void _discardFinished() {
    final path = _finishedVideoPath;
    if (path != null) File(path).delete().ignore();
    setState(() {
      _finishedVideoPath = null;
      _recState = _RecState.idle;
    });
  }

  Future<void> _saveFinishedRecording() async {
    final script = _script;
    final path = _finishedVideoPath;
    if (script == null || path == null) return;
    final resolution = _camera != null
        ? '${_camera!.value.previewSize?.width.toInt()}x${_camera!.value.previewSize?.height.toInt()}'
        : 'n/a';
    await ScriptRepository.instance.saveRecording(
      scriptId: script.id,
      title: script.title,
      filePath: path,
      durationSeconds: _recordingSeconds.round(),
      resolution: resolution,
    );
    setState(() {
      _finishedVideoPath = null;
      _recState = _RecState.idle;
    });
  }

  @override
  void dispose() {
    _hideTimer?.cancel();
    _recordingTimer?.cancel();
    _engine.dispose();
    _camera?.dispose();
    WakelockPlus.disable();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final script = _script;
    final settings = _settings;
    if (script == null || settings == null) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: LayoutBuilder(
        builder: (context, constraints) {
          if (_viewportHeight != constraints.maxHeight) {
            _viewportHeight = constraints.maxHeight;
            WidgetsBinding.instance.addPostFrameCallback((_) => _recomputeMetrics());
          }
          final paddingTop = _viewportHeight * 0.4;
          final paddingBottom = _viewportHeight * 0.6;

          // The drag-to-scroll/tap-to-reveal gesture only wraps the
          // background layer (camera + text + marker) — it used to wrap the
          // whole screen including the control buttons, which put a
          // pan-gesture recognizer in the same arena as every button's own
          // tap recognizer and made taps unreliable (worst on iOS).
          return Stack(
            fit: StackFit.expand,
            children: [
              GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: _revealControls,
                onVerticalDragStart: (d) {
                  _dragStart = d.globalPosition;
                  if (_playing) _togglePlay();
                },
                onVerticalDragUpdate: (d) {
                  final start = _dragStart;
                  if (start == null) return;
                  final delta = start.dy - d.globalPosition.dy;
                  _dragStart = d.globalPosition;
                  _engine.nudge(delta);
                },
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (_studioMode && _camera != null && _camera!.value.isInitialized)
                      _CameraFill(controller: _camera!),
                    TeleprompterText(
                      content: script.content,
                      settings: settings,
                      paddingTop: paddingTop,
                      paddingBottom: paddingBottom,
                      position: _position,
                      contentKey: _contentKey,
                      maxWidth: constraints.maxWidth * settings.textWidth,
                    ),
                    if (settings.markerEnabled)
                      Align(
                        alignment: Alignment.center,
                        child: Container(
                          height: 1,
                          color: Colors.white.withValues(alpha: 0.25),
                        ),
                      ),
                  ],
                ),
              ),
              if (_recState == _RecState.countdown)
                _CountdownOverlay(value: _countdownValue),
              if (_recState == _RecState.finished && _finishedVideoPath != null)
                _FinishScreen(
                  videoPath: _finishedVideoPath!,
                  onRestart: () {
                    _discardFinished();
                    _engine.seek(0);
                  },
                  onDelete: _discardFinished,
                  onSave: _saveFinishedRecording,
                ),
              if (_recState != _RecState.countdown && _recState != _RecState.finished)
                AnimatedOpacity(
                  opacity: _controlsVisible ? 1 : 0,
                  duration: const Duration(milliseconds: 200),
                  child: IgnorePointer(
                    ignoring: !_controlsVisible,
                    child: _ControlsBar(
                      playing: _playing,
                      speed: settings.scrollSpeed,
                      mirrorMode: settings.mirrorMode,
                      studioMode: _studioMode,
                      recState: _recState,
                      recordingSeconds: _recordingSeconds.round(),
                      onBack: () => Navigator.pop(context),
                      onTogglePlay: _togglePlay,
                      onSeekRelative: _seekRelative,
                      onSpeedChange: (v) => _updateSettings(settings.copyWith(scrollSpeed: v)),
                      onToggleMirror: _toggleMirror,
                      onOpenSettings: () => showSettingsSheet(
                        context: context,
                        settings: settings,
                        onChange: _updateSettings,
                      ),
                      onToggleStudio: _toggleStudio,
                      onRecordToggle: _onRecordToggle,
                      onFinish: _finishRecording,
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _CameraFill extends StatelessWidget {
  const _CameraFill({required this.controller});
  final CameraController controller;

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    var scale = size.aspectRatio * controller.value.aspectRatio;
    if (scale < 1) scale = 1 / scale;
    return Transform.scale(
      scale: scale,
      child: Center(child: CameraPreview(controller)),
    );
  }
}

class _CountdownOverlay extends StatelessWidget {
  const _CountdownOverlay({required this.value});
  final int value;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black54,
      alignment: Alignment.center,
      child: Text(
        value == 0 ? 'GO' : '$value',
        style: const TextStyle(fontSize: 96, fontWeight: FontWeight.bold, color: Colors.white),
      ),
    );
  }
}

class _FinishScreen extends StatelessWidget {
  const _FinishScreen({
    required this.videoPath,
    required this.onRestart,
    required this.onDelete,
    required this.onSave,
  });

  final String videoPath;
  final VoidCallback onRestart;
  final VoidCallback onDelete;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black.withValues(alpha: 0.92),
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text('Enregistrement terminé',
              style: TextStyle(color: Colors.white, fontSize: 18)),
          const SizedBox(height: 20),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            alignment: WrapAlignment.center,
            children: [
              FilledButton(
                style: FilledButton.styleFrom(backgroundColor: kPrimary),
                onPressed: onSave,
                child: const Text('Enregistrer dans ma bibliothèque'),
              ),
              OutlinedButton(onPressed: onRestart, child: const Text('Recommencer')),
              OutlinedButton(
                style: OutlinedButton.styleFrom(foregroundColor: Colors.redAccent),
                onPressed: onDelete,
                child: const Text('Supprimer'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ControlsBar extends StatelessWidget {
  const _ControlsBar({
    required this.playing,
    required this.speed,
    required this.mirrorMode,
    required this.studioMode,
    required this.recState,
    required this.recordingSeconds,
    required this.onBack,
    required this.onTogglePlay,
    required this.onSeekRelative,
    required this.onSpeedChange,
    required this.onToggleMirror,
    required this.onOpenSettings,
    required this.onToggleStudio,
    required this.onRecordToggle,
    required this.onFinish,
  });

  final bool playing;
  final double speed;
  final bool mirrorMode;
  final bool studioMode;
  final _RecState recState;
  final int recordingSeconds;
  final VoidCallback onBack;
  final VoidCallback onTogglePlay;
  final void Function(double) onSeekRelative;
  final void Function(double) onSpeedChange;
  final VoidCallback onToggleMirror;
  final VoidCallback onOpenSettings;
  final VoidCallback onToggleStudio;
  final VoidCallback onRecordToggle;
  final VoidCallback onFinish;

  static const _speeds = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.bottomCenter,
      child: Container(
        padding: const EdgeInsets.fromLTRB(8, 24, 8, 20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.bottomCenter,
            end: Alignment.topCenter,
            colors: [Colors.black.withValues(alpha: 0.8), Colors.transparent],
          ),
        ),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (studioMode && recState != _RecState.idle)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black54,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          formatDuration(recordingSeconds),
                          style: const TextStyle(color: Colors.white),
                        ),
                      ),
                      const SizedBox(width: 8),
                      TextButton(
                        onPressed: onFinish,
                        style: TextButton.styleFrom(
                          backgroundColor: Colors.black54,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                        child: const Text('Terminer'),
                      ),
                    ],
                  ),
                ),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton(
                    onPressed: onBack,
                    icon: const Icon(Icons.arrow_back, color: Colors.white70),
                  ),
                  IconButton(
                    onPressed: () => onSeekRelative(-10),
                    icon: const Icon(Icons.fast_rewind, color: Colors.white70),
                  ),
                  IconButton.filled(
                    style: IconButton.styleFrom(backgroundColor: Colors.white),
                    onPressed: onTogglePlay,
                    icon: Icon(playing ? Icons.pause : Icons.play_arrow, color: Colors.black),
                  ),
                  IconButton(
                    onPressed: () => onSeekRelative(10),
                    icon: const Icon(Icons.fast_forward, color: Colors.white70),
                  ),
                  PopupMenuButton<double>(
                    initialValue: speed,
                    color: kCard,
                    onSelected: onSpeedChange,
                    itemBuilder: (context) => _speeds
                        .map((s) => PopupMenuItem(value: s, child: Text('${s}x')))
                        .toList(),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.white24),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text('${speed}x', style: const TextStyle(color: Colors.white)),
                    ),
                  ),
                ],
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton(
                    onPressed: onToggleMirror,
                    icon: Icon(Icons.flip,
                        color: mirrorMode ? kPrimary : Colors.white70),
                  ),
                  IconButton(
                    onPressed: onToggleStudio,
                    icon: Icon(Icons.videocam,
                        color: studioMode ? kPrimary : Colors.white70),
                  ),
                  if (studioMode)
                    IconButton(
                      onPressed: onRecordToggle,
                      icon: Icon(
                        recState == _RecState.recording || recState == _RecState.paused
                            ? Icons.pause_circle
                            : Icons.fiber_manual_record,
                        color: Colors.redAccent,
                        size: 32,
                      ),
                    ),
                  IconButton(
                    onPressed: onOpenSettings,
                    icon: const Icon(Icons.settings_outlined, color: Colors.white70),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

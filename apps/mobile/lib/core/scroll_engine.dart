import 'package:flutter/scheduler.dart';

/// Time-elapsed based auto-scroll engine — mirrors the web app's
/// [ScrollEngine] (apps/teleprompt/src/lib/scroll-engine.ts). Position is
/// derived from wall-clock delta on every tick rather than a fixed per-frame
/// increment, so playback stays smooth regardless of device frame rate.
class ScrollEngine {
  ScrollEngine({
    required TickerProvider vsync,
    required this.onUpdate,
    this.onEnd,
    double baseRate = 40,
  }) : _baseRate = baseRate {
    _ticker = vsync.createTicker(_onTick);
  }

  final void Function(double position) onUpdate;
  final void Function()? onEnd;

  late final Ticker _ticker;
  double _position = 0;
  double _speed = 1;
  double _baseRate;
  double _maxPosition = double.infinity;
  Duration _lastElapsed = Duration.zero;

  double get position => _position;
  bool get isPlaying => _ticker.isTicking;
  double get baseRate => _baseRate;
  double get speed => _speed;
  double get maxPosition => _maxPosition;

  void setBaseRate(double rate) => _baseRate = rate;
  void setSpeed(double speed) => _speed = speed;
  void setMaxPosition(double max) => _maxPosition = max;

  void seek(double position) {
    _position = position.clamp(0, _maxPosition == double.infinity ? position : _maxPosition);
    onUpdate(_position);
  }

  void nudge(double deltaPx) => seek(_position + deltaPx);

  void play() {
    if (_ticker.isTicking) return;
    _lastElapsed = Duration.zero;
    _ticker.start();
  }

  void pause() {
    if (_ticker.isTicking) _ticker.stop();
  }

  void toggle() {
    if (_ticker.isTicking) {
      pause();
    } else {
      play();
    }
  }

  void dispose() {
    _ticker.dispose();
  }

  void _onTick(Duration elapsed) {
    final dtSeconds = _lastElapsed == Duration.zero
        ? 0.0
        : (elapsed - _lastElapsed).inMicroseconds / 1e6;
    _lastElapsed = elapsed;

    final next = _position + _baseRate * _speed * dtSeconds;
    if (next >= _maxPosition) {
      _position = _maxPosition;
      onUpdate(_position);
      pause();
      onEnd?.call();
      return;
    }
    _position = next;
    onUpdate(_position);
  }
}

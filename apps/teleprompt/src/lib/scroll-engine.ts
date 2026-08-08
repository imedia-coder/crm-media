/**
 * Time-elapsed based auto-scroll engine (cahier des charges §12).
 * Position is derived from wall-clock delta each animation frame, not from a
 * fixed per-tick increment, so playback stays smooth regardless of the
 * device's actual frame rate and never accumulates drift while paused.
 */
export type ScrollEngineListener = (position: number) => void;

export interface ScrollEngineOptions {
  /** px/second at speed = 1x */
  baseRate: number;
  onUpdate: ScrollEngineListener;
  /** Called when position reaches maxPosition during playback */
  onEnd?: () => void;
}

export class ScrollEngine {
  private position = 0;
  private speed = 1;
  private baseRate: number;
  private playing = false;
  private rafId: number | null = null;
  private lastTimestamp = 0;
  private maxPosition = Infinity;
  private onUpdate: ScrollEngineListener;
  private onEnd?: () => void;

  constructor(options: ScrollEngineOptions) {
    this.baseRate = options.baseRate;
    this.onUpdate = options.onUpdate;
    this.onEnd = options.onEnd;
  }

  setBaseRate(rate: number) {
    this.baseRate = rate;
  }

  getBaseRate() {
    return this.baseRate;
  }

  setSpeed(speed: number) {
    this.speed = speed;
  }

  getSpeed() {
    return this.speed;
  }

  setMaxPosition(max: number) {
    this.maxPosition = max;
  }

  getMaxPosition() {
    return this.maxPosition;
  }

  getPosition() {
    return this.position;
  }

  isPlaying() {
    return this.playing;
  }

  seek(position: number) {
    this.position = Math.max(0, Math.min(position, this.maxPosition));
    this.onUpdate(this.position);
  }

  nudge(deltaPx: number) {
    this.seek(this.position + deltaPx);
  }

  play() {
    if (this.playing) return;
    this.playing = true;
    this.lastTimestamp = performance.now();
    this.tick();
  }

  pause() {
    this.playing = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  toggle() {
    if (this.playing) this.pause();
    else this.play();
  }

  dispose() {
    this.pause();
  }

  private tick = () => {
    if (!this.playing) return;
    const now = performance.now();
    const dtSeconds = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;

    const next = this.position + this.baseRate * this.speed * dtSeconds;
    if (next >= this.maxPosition) {
      this.position = this.maxPosition;
      this.onUpdate(this.position);
      this.pause();
      this.onEnd?.();
      return;
    }

    this.position = next;
    this.onUpdate(this.position);
    this.rafId = requestAnimationFrame(this.tick);
  };
}

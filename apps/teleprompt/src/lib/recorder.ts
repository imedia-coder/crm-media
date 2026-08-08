export type CameraFacing = "user" | "environment";

export async function getCameraStream(facing: CameraFacing = "user"): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
    },
  });
}

function pickMimeType(): string {
  const candidates = [
    "video/mp4;codecs=avc1,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "";
}

export class SessionRecorder {
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startedAt = 0;
  private elapsedBeforePause = 0;
  mimeType: string;

  constructor(private stream: MediaStream) {
    this.mimeType = pickMimeType();
  }

  start() {
    this.chunks = [];
    this.elapsedBeforePause = 0;
    this.recorder = new MediaRecorder(
      this.stream,
      this.mimeType ? { mimeType: this.mimeType } : undefined,
    );
    this.mimeType = this.recorder.mimeType || this.mimeType;
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.recorder.start();
    this.startedAt = performance.now();
  }

  pause() {
    if (this.recorder?.state === "recording") {
      this.recorder.pause();
      this.elapsedBeforePause += performance.now() - this.startedAt;
    }
  }

  resume() {
    if (this.recorder?.state === "paused") {
      this.recorder.resume();
      this.startedAt = performance.now();
    }
  }

  get elapsedSeconds(): number {
    const running = this.recorder?.state === "recording" ? performance.now() - this.startedAt : 0;
    return (this.elapsedBeforePause + running) / 1000;
  }

  get state(): RecordingState | "inactive" {
    return this.recorder?.state ?? "inactive";
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.recorder) {
        resolve(new Blob());
        return;
      }
      this.recorder.onstop = () => {
        resolve(new Blob(this.chunks, { type: this.mimeType || "video/webm" }));
      };
      if (this.recorder.state !== "inactive") this.recorder.stop();
      else resolve(new Blob(this.chunks, { type: this.mimeType || "video/webm" }));
    });
  }
}

export function createMicLevelMeter(
  stream: MediaStream,
  onLevel: (level: number) => void,
): () => void {
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);
  const data = new Uint8Array(analyser.frequencyBinCount);
  let rafId = 0;

  const loop = () => {
    analyser.getByteTimeDomainData(data);
    let sumSquares = 0;
    for (let i = 0; i < data.length; i++) {
      const normalized = (data[i] - 128) / 128;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / data.length);
    onLevel(Math.min(1, rms * 4));
    rafId = requestAnimationFrame(loop);
  };
  loop();

  return () => {
    cancelAnimationFrame(rafId);
    source.disconnect();
    ctx.close();
  };
}

export function estimateFreeStorageBytes(): Promise<number | null> {
  if (navigator.storage?.estimate) {
    return navigator.storage.estimate().then((est) => {
      if (est.quota == null || est.usage == null) return null;
      return est.quota - est.usage;
    });
  }
  return Promise.resolve(null);
}

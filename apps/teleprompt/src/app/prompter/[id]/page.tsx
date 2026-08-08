"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getScript,
  getSession,
  getSettings,
  saveSession,
  saveSettings,
  clearSession,
  saveRecording,
} from "@/lib/storage";
import { Script, ScriptSettings } from "@/lib/types";
import { ScrollEngine } from "@/lib/scroll-engine";
import { estimateDurationSeconds } from "@/lib/duration";
import {
  createMicLevelMeter,
  estimateFreeStorageBytes,
  getCameraStream,
  SessionRecorder,
} from "@/lib/recorder";
import { SmartFollowTracker } from "@/lib/smart-follow";
import { ContinuousSpeechRecognizer, isSpeechRecognitionSupported } from "@/lib/speech-recognition";
import { TeleprompterTextView } from "@/components/prompter/text-view";
import { ControlsBar } from "@/components/prompter/controls-bar";
import { SettingsPanel } from "@/components/prompter/settings-panel";
import { CameraBackground } from "@/components/prompter/camera-background";
import { CountdownOverlay } from "@/components/prompter/countdown-overlay";
import { FinishScreen } from "@/components/prompter/finish-screen";
import { ResumeDialog } from "@/components/prompter/resume-dialog";

type RecordingState = "idle" | "countdown" | "recording" | "paused" | "finished";

const LOW_STORAGE_BYTES = 50 * 1024 * 1024;

export default function PrompterPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [script, setScript] = useState<Script | null>(null);
  const [settings, setSettings] = useState<ScriptSettings | null>(null);
  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [studioMode, setStudioMode] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [countdownValue, setCountdownValue] = useState(0);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [finishedVideoUrl, setFinishedVideoUrl] = useState<string | null>(null);
  const [smartFollowActive, setSmartFollowActive] = useState(false);

  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ScrollEngine | null>(null);
  const recorderRef = useRef<SessionRecorder | null>(null);
  const micCleanupRef = useRef<(() => void) | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishedBlobRef = useRef<Blob | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const smartFollowTrackerRef = useRef<SmartFollowTracker | null>(null);
  const speechRecognizerRef = useRef<ContinuousSpeechRecognizer | null>(null);
  const smartFollowSpeedRef = useRef(1);
  const smartFollowIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [viewportHeight, setViewportHeight] = useState(0);

  // Load script, settings, session
  useEffect(() => {
    (async () => {
      const s = await getScript(id);
      if (!s) return;
      setScript(s);
      const st = await getSettings(id);
      setSettings(st);
      const session = await getSession(id);
      if (session && session.position > 20) {
        setShowResume(true);
      }
    })();
  }, [id]);

  // Create scroll engine once
  useEffect(() => {
    const engine = new ScrollEngine({
      baseRate: 40,
      onUpdate: (p) => setPosition(p),
      onEnd: () => setPlaying(false),
    });
    engineRef.current = engine;
    return () => engine.dispose();
  }, []);

  // Measure viewport height — container mounts only once script/settings are
  // loaded, so a plain mount-time ref read would race the loading screen;
  // observe the element itself once React hands it to us via the callback ref.
  useEffect(() => {
    if (!containerEl) return;
    const measure = () => setViewportHeight(containerEl.clientHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(containerEl);
    return () => observer.disconnect();
  }, [containerEl]);

  const paddingTop = Math.round(viewportHeight * 0.4);
  const paddingBottom = Math.round(viewportHeight * 0.6);

  // Recompute scroll metrics (max position + base rate) when content/typography changes
  useLayoutEffect(() => {
    if (!script || !settings || !engineRef.current || !textRef.current) return;
    const scrollHeight = textRef.current.scrollHeight;
    const maxPosition = Math.max(0, scrollHeight - viewportHeight);
    engineRef.current.setMaxPosition(maxPosition);
    const durationSeconds = estimateDurationSeconds(script.content, script.wordsPerMinute);
    const baseRate = durationSeconds > 0 ? maxPosition / durationSeconds : settings.fontSize * 0.9;
    engineRef.current.setBaseRate(baseRate || settings.fontSize * 0.9);
  }, [script, settings, viewportHeight]);

  useEffect(() => {
    if (settings) engineRef.current?.setSpeed(settings.scrollSpeed);
  }, [settings]);

  // Persist session while playing
  useEffect(() => {
    if (!playing || !script) return;
    const interval = setInterval(() => {
      saveSession({
        scriptId: script.id,
        position,
        speed: settings?.scrollSpeed ?? 1,
        updatedAt: Date.now(),
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [playing, position, script, settings]);

  const updateSettings = useCallback(
    (patch: Partial<ScriptSettings>) => {
      setSettings((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        saveSettings(next);
        return next;
      });
    },
    [],
  );

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible((v) => (playing ? false : v));
    }, 3000);
  }, [playing]);

  useEffect(() => {
    revealControls();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const togglePlay = useCallback(() => {
    engineRef.current?.toggle();
    setPlaying(engineRef.current?.isPlaying() ?? false);
  }, []);

  const seekRelative = useCallback((deltaSeconds: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.nudge(deltaSeconds * engine.getBaseRate() * engine.getSpeed());
  }, []);

  // Fullscreen sync
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  }, []);

  const toggleMirror = useCallback(() => {
    updateSettings({ mirrorMode: !settings?.mirrorMode });
  }, [settings, updateSettings]);

  // Studio (camera) mode lifecycle
  const toggleStudio = useCallback(async () => {
    if (studioMode) {
      cameraStream?.getTracks().forEach((t) => t.stop());
      micCleanupRef.current?.();
      micCleanupRef.current = null;
      setCameraStream(null);
      setStudioMode(false);
      return;
    }
    try {
      const stream = await getCameraStream("user");
      setCameraStream(stream);
      setStudioMode(true);
      micCleanupRef.current = createMicLevelMeter(stream, setMicLevel);
    } catch {
      alert(
        "Pour enregistrer votre vidéo, l'application a besoin d'accéder à votre caméra et à votre microphone.",
      );
    }
  }, [studioMode, cameraStream]);

  useEffect(() => {
    return () => {
      cameraStream?.getTracks().forEach((t) => t.stop());
      micCleanupRef.current?.();
      speechRecognizerRef.current?.stop();
      if (smartFollowIntervalRef.current) clearInterval(smartFollowIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Smart Follow (§36-39) — speech recognition drives scroll position and
  // speed instead of the fixed WPM-derived rate. Corrections are applied as
  // a partial nudge toward the matched position rather than a hard snap, so
  // the motion stays smooth even though matches arrive in irregular bursts.
  const stopSmartFollow = useCallback(() => {
    speechRecognizerRef.current?.stop();
    speechRecognizerRef.current = null;
    smartFollowTrackerRef.current = null;
    if (smartFollowIntervalRef.current) {
      clearInterval(smartFollowIntervalRef.current);
      smartFollowIntervalRef.current = null;
    }
    setSmartFollowActive(false);
    if (settings) engineRef.current?.setSpeed(settings.scrollSpeed);
  }, [settings]);

  const toggleSmartFollow = useCallback(() => {
    if (smartFollowActive) {
      stopSmartFollow();
      return;
    }
    if (!isSpeechRecognitionSupported()) {
      alert("Smart Follow nécessite la reconnaissance vocale, non disponible sur ce navigateur.");
      return;
    }
    if (!script) return;

    const engine = engineRef.current;
    const maxPosition = engine?.getMaxPosition() ?? 0;
    const progress = maxPosition > 0 ? position / maxPosition : 0;
    const tracker = new SmartFollowTracker(script.content);
    tracker.reset(Math.round(tracker.totalWords * progress));
    smartFollowTrackerRef.current = tracker;
    smartFollowSpeedRef.current = settings?.scrollSpeed ?? 1;

    const recognizer = new ContinuousSpeechRecognizer(script.language, {
      onResult: (transcript, isFinal) => {
        if (!isFinal) return;
        const match = smartFollowTrackerRef.current?.matchTranscript(transcript);
        if (!match) return;
        const eng = engineRef.current;
        if (!eng) return;
        const target = eng.getMaxPosition() * (smartFollowTrackerRef.current?.progress ?? 0);
        const current = eng.getPosition();
        eng.seek(current + (target - current) * 0.35);
      },
      onError: (message) => {
        if (message === "not-allowed" || message === "service-not-allowed") {
          alert(
            "Pour utiliser Smart Follow, l'application a besoin d'accéder à votre microphone.",
          );
          stopSmartFollow();
        }
      },
    });
    speechRecognizerRef.current = recognizer;
    recognizer.start();

    smartFollowIntervalRef.current = setInterval(() => {
      const t = smartFollowTrackerRef.current;
      if (!t || !script) return;
      smartFollowSpeedRef.current = t.estimateSpeedMultiplier(
        script.wordsPerMinute,
        smartFollowSpeedRef.current,
      );
      engineRef.current?.setSpeed(smartFollowSpeedRef.current);
    }, 400);

    engineRef.current?.play();
    setPlaying(true);
    setSmartFollowActive(true);
  }, [smartFollowActive, stopSmartFollow, script, settings, position]);

  const beginRecording = useCallback(() => {
    if (!cameraStream) return;
    const recorder = new SessionRecorder(cameraStream);
    recorderRef.current = recorder;
    recorder.start();
    setRecordingState("recording");
    setRecordingSeconds(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds(recorderRef.current?.elapsedSeconds ?? 0);
    }, 250);
    engineRef.current?.play();
    setPlaying(true);
  }, [cameraStream]);

  const startCountdown = useCallback(async () => {
    const free = await estimateFreeStorageBytes();
    if (free !== null && free < LOW_STORAGE_BYTES) {
      if (!confirm("Espace de stockage disponible insuffisant. Continuer quand même ?")) return;
    }
    const seconds = settings?.countdownSeconds ?? 0;
    if (seconds === 0) {
      beginRecording();
      return;
    }
    setRecordingState("countdown");
    let remaining = seconds;
    setCountdownValue(remaining);
    const tick = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(tick);
        setCountdownValue(0);
        beginRecording();
        return;
      }
      setCountdownValue(remaining);
    }, 1000);
  }, [settings, beginRecording]);

  const finishRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    const blob = await recorder.stop();
    finishedBlobRef.current = blob;
    setFinishedVideoUrl(URL.createObjectURL(blob));
    setRecordingState("finished");
    engineRef.current?.pause();
    setPlaying(false);
  }, []);

  const onRecordToggle = useCallback(() => {
    if (recordingState === "idle") {
      startCountdown();
    } else if (recordingState === "recording") {
      recorderRef.current?.pause();
      engineRef.current?.pause();
      setPlaying(false);
      setRecordingState("paused");
    } else if (recordingState === "paused") {
      recorderRef.current?.resume();
      engineRef.current?.play();
      setPlaying(true);
      setRecordingState("recording");
    }
  }, [recordingState, startCountdown]);

  const discardFinished = useCallback(() => {
    if (finishedVideoUrl) URL.revokeObjectURL(finishedVideoUrl);
    finishedBlobRef.current = null;
    setFinishedVideoUrl(null);
    setRecordingState("idle");
  }, [finishedVideoUrl]);

  const handleRestart = useCallback(() => {
    discardFinished();
    engineRef.current?.seek(0);
  }, [discardFinished]);

  const handleSaveRecording = useCallback(async () => {
    if (!script || !cameraStream || !finishedBlobRef.current) return;
    const track = cameraStream.getVideoTracks()[0];
    const trackSettings = track?.getSettings();
    const resolution =
      trackSettings?.width && trackSettings?.height
        ? `${trackSettings.width}x${trackSettings.height}`
        : "n/a";
    await saveRecording(
      {
        scriptId: script.id,
        scriptTitle: script.title,
        title: script.title,
        duration: recordingSeconds,
        resolution,
        mimeType: recorderRef.current?.mimeType ?? "video/webm",
      },
      finishedBlobRef.current,
    );
    discardFinished();
  }, [script, cameraStream, recordingSeconds, discardFinished]);

  // Keyboard shortcuts (web/desktop)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;
      switch (e.key) {
        case " ":
        case "MediaPlayPause":
        case "AudioVolumeUp":
        case "AudioVolumeDown":
          // Bluetooth "shutter"/presenter remotes (AB Shutter3 and similar)
          // pair as HID keyboards and send volume/media keys — Web Bluetooth
          // can't talk to them directly (HID is blocklisted), so this is the
          // only way the web app can react to their button presses.
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowUp":
          updateSettings({ scrollSpeed: Math.min(2, (settings?.scrollSpeed ?? 1) + 0.25) });
          break;
        case "ArrowDown":
          updateSettings({ scrollSpeed: Math.max(0.25, (settings?.scrollSpeed ?? 1) - 0.25) });
          break;
        case "ArrowLeft":
        case "PageUp":
          seekRelative(-10);
          break;
        case "ArrowRight":
        case "PageDown":
          seekRelative(10);
          break;
        case "m":
        case "M":
          toggleMirror();
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
        case "r":
        case "R":
          if (studioMode) onRecordToggle();
          break;
        case "Escape":
          if (document.fullscreenElement) document.exitFullscreen();
          break;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePlay, seekRelative, toggleMirror, toggleFullscreen, studioMode, onRecordToggle, settings, updateSettings]);

  // Manual drag / swipe scroll
  const dragState = useRef<{ lastY: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button, select, a")) return;
    dragState.current = { lastY: e.clientY };
    if (playing) togglePlay();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current) return;
    const delta = dragState.current.lastY - e.clientY;
    dragState.current.lastY = e.clientY;
    engineRef.current?.nudge(delta);
  };
  const onPointerUp = () => {
    dragState.current = null;
  };

  if (!script || !settings) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-black text-white/70">
        Chargement…
      </div>
    );
  }

  return (
    <div
      ref={setContainerEl}
      className="relative h-dvh w-full touch-none overflow-hidden bg-black"
      onMouseMove={revealControls}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {studioMode && <CameraBackground stream={cameraStream} />}

      <TeleprompterTextView
        ref={textRef}
        content={script.content}
        settings={settings}
        paddingTop={paddingTop}
        paddingBottom={paddingBottom}
        transform={position}
      />

      {settings.markerEnabled && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 border-y border-white/25" />
      )}

      {studioMode && recordingState === "idle" && (
        <div className="absolute inset-x-0 top-4 z-10 flex justify-center">
          <div className="flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-xs text-white">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Micro détecté
            <span className="ml-1 h-1.5 w-16 overflow-hidden rounded-full bg-white/20">
              <span
                className="block h-full bg-emerald-400 transition-[width]"
                style={{ width: `${Math.round(micLevel * 100)}%` }}
              />
            </span>
          </div>
        </div>
      )}

      {recordingState === "countdown" && <CountdownOverlay value={countdownValue} />}

      {recordingState === "finished" && finishedVideoUrl && (
        <FinishScreen
          videoUrl={finishedVideoUrl}
          onRestart={handleRestart}
          onDelete={discardFinished}
          onDone={handleSaveRecording}
        />
      )}

      {showResume && (
        <ResumeDialog
          onResume={async () => {
            const session = await getSession(id);
            if (session) {
              engineRef.current?.seek(session.position);
              updateSettings({ scrollSpeed: session.speed });
            }
            setShowResume(false);
          }}
          onRestart={async () => {
            await clearSession(id);
            engineRef.current?.seek(0);
            setShowResume(false);
          }}
        />
      )}

      {recordingState !== "countdown" && recordingState !== "finished" && !showResume && (
        <ControlsBar
          visible={controlsVisible}
          playing={playing}
          speed={settings.scrollSpeed}
          mirrorMode={settings.mirrorMode}
          studioMode={studioMode}
          isFullscreen={isFullscreen}
          recordingState={recordingState}
          recordingSeconds={recordingSeconds}
          smartFollowActive={smartFollowActive}
          onBack={() => router.push(`/editor/${script.id}`)}
          onTogglePlay={togglePlay}
          onSeekRelative={seekRelative}
          onSpeedChange={(s) => updateSettings({ scrollSpeed: s })}
          onToggleMirror={toggleMirror}
          onOpenSettings={() => setShowSettings(true)}
          onToggleFullscreen={toggleFullscreen}
          onToggleStudio={toggleStudio}
          onRecordToggle={onRecordToggle}
          onToggleSmartFollow={toggleSmartFollow}
        />
      )}

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onChange={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

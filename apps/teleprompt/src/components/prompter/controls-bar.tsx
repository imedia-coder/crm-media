"use client";

import {
  CameraIcon,
  ChevronLeftIcon,
  FlipHorizontalIcon,
  ForwardIcon,
  MaximizeIcon,
  MinimizeIcon,
  PauseIcon,
  PlayIcon,
  RecordIcon,
  RewindIcon,
  SettingsIcon,
  StopIcon,
} from "@/components/icons";
import { formatDuration } from "@/lib/duration";

const SPEED_PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

export function ControlsBar({
  visible,
  playing,
  speed,
  mirrorMode,
  studioMode,
  isFullscreen,
  recordingState,
  recordingSeconds,
  onBack,
  onTogglePlay,
  onSeekRelative,
  onSpeedChange,
  onToggleMirror,
  onOpenSettings,
  onToggleFullscreen,
  onToggleStudio,
  onRecordToggle,
}: {
  visible: boolean;
  playing: boolean;
  speed: number;
  mirrorMode: boolean;
  studioMode: boolean;
  isFullscreen: boolean;
  recordingState: "idle" | "countdown" | "recording" | "paused";
  recordingSeconds: number;
  onBack: () => void;
  onTogglePlay: () => void;
  onSeekRelative: (deltaSeconds: number) => void;
  onSpeedChange: (speed: number) => void;
  onToggleMirror: () => void;
  onOpenSettings: () => void;
  onToggleFullscreen: () => void;
  onToggleStudio: () => void;
  onRecordToggle: () => void;
}) {
  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-20 transition-opacity duration-200 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {studioMode && recordingState !== "idle" && (
        <div className="flex justify-center pb-2">
          <span className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-sm font-medium text-white">
            <RecordIcon className="h-3 w-3 text-destructive" />
            {formatDuration(recordingSeconds)}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-10">
        <button
          onClick={onBack}
          aria-label="Retour"
          className="rounded-lg p-2.5 text-white/80 hover:bg-white/10"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>

        <button
          onClick={() => onSeekRelative(-10)}
          aria-label="Reculer de 10 secondes"
          className="rounded-lg p-2.5 text-white/80 hover:bg-white/10"
        >
          <RewindIcon className="h-5 w-5" />
        </button>

        <button
          onClick={onTogglePlay}
          aria-label={playing ? "Pause" : "Lecture"}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black"
        >
          {playing ? (
            <PauseIcon className="h-5 w-5" />
          ) : (
            <PlayIcon className="ml-0.5 h-5 w-5" />
          )}
        </button>

        <button
          onClick={() => onSeekRelative(10)}
          aria-label="Avancer de 10 secondes"
          className="rounded-lg p-2.5 text-white/80 hover:bg-white/10"
        >
          <ForwardIcon className="h-5 w-5" />
        </button>

        <select
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          aria-label="Vitesse de défilement"
          className="rounded-lg border border-white/20 bg-black/40 px-2 py-2 text-sm text-white"
        >
          {SPEED_PRESETS.map((s) => (
            <option key={s} value={s}>
              {s}x
            </option>
          ))}
        </select>

        <div className="mx-1 flex-1" />

        <button
          onClick={onToggleMirror}
          aria-label="Mode miroir"
          className={`rounded-lg p-2.5 hover:bg-white/10 ${mirrorMode ? "text-primary" : "text-white/80"}`}
        >
          <FlipHorizontalIcon className="h-5 w-5" />
        </button>

        <button
          onClick={onToggleStudio}
          aria-label="Caméra"
          className={`rounded-lg p-2.5 hover:bg-white/10 ${studioMode ? "text-primary" : "text-white/80"}`}
        >
          <CameraIcon className="h-5 w-5" />
        </button>

        {studioMode && (
          <button
            onClick={onRecordToggle}
            aria-label={recordingState === "recording" ? "Arrêter" : "Enregistrer"}
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white"
          >
            {recordingState === "recording" || recordingState === "paused" ? (
              <StopIcon className="h-4 w-4 text-destructive" />
            ) : (
              <RecordIcon className="h-6 w-6 text-destructive" />
            )}
          </button>
        )}

        <button
          onClick={onOpenSettings}
          aria-label="Réglages"
          className="rounded-lg p-2.5 text-white/80 hover:bg-white/10"
        >
          <SettingsIcon className="h-5 w-5" />
        </button>

        <button
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
          className="rounded-lg p-2.5 text-white/80 hover:bg-white/10"
        >
          {isFullscreen ? (
            <MinimizeIcon className="h-5 w-5" />
          ) : (
            <MaximizeIcon className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
}

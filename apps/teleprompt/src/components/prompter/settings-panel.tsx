"use client";

import { ColorTheme, ScriptSettings } from "@/lib/types";

const FONT_SIZES = [24, 32, 40, 48, 56, 64, 72];
const COUNTDOWNS: ScriptSettings["countdownSeconds"][] = [0, 3, 5, 10];

const THEME_OPTIONS: { key: ColorTheme; label: string; bg: string; fg: string }[] = [
  { key: "classic", label: "Classique", bg: "#000000", fg: "#ffffff" },
  { key: "yellow", label: "Jaune", bg: "#000000", fg: "#ffde59" },
  { key: "light", label: "Clair", bg: "#ffffff", fg: "#0a0a0a" },
  { key: "custom", label: "Personnalisé", bg: "#111111", fg: "#7c5cff" },
];

export function SettingsPanel({
  settings,
  onChange,
  onClose,
}: {
  settings: ScriptSettings;
  onChange: (patch: Partial<ScriptSettings>) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="no-scrollbar flex h-full w-full max-w-sm flex-col gap-6 overflow-y-auto bg-card p-5 text-card-foreground"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Réglages</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary"
          >
            Fermer
          </button>
        </div>

        <section>
          <p className="mb-2 text-sm font-medium text-muted-foreground">Taille du texte</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onChange({ fontSize: Math.max(24, settings.fontSize - 8) })}
              className="h-10 w-10 rounded-lg border border-border text-lg font-semibold hover:bg-secondary"
            >
              A−
            </button>
            <div className="flex-1 text-center text-sm text-muted-foreground">
              {settings.fontSize}px
            </div>
            <button
              onClick={() => onChange({ fontSize: Math.min(96, settings.fontSize + 8) })}
              className="h-10 w-10 rounded-lg border border-border text-lg font-semibold hover:bg-secondary"
            >
              A+
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {FONT_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => onChange({ fontSize: size })}
                className={`rounded-md px-2.5 py-1 text-xs ${
                  settings.fontSize === size
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </section>

        <section>
          <p className="mb-2 text-sm font-medium text-muted-foreground">Couleurs</p>
          <div className="grid grid-cols-2 gap-2">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => onChange({ colorTheme: opt.key })}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  settings.colorTheme === opt.key ? "border-primary" : "border-border"
                }`}
              >
                <span
                  className="h-5 w-5 rounded-full border border-border"
                  style={{ background: opt.bg, color: opt.fg }}
                >
                  <span className="block h-full w-full text-center text-[10px] leading-5">
                    A
                  </span>
                </span>
                {opt.label}
              </button>
            ))}
          </div>
          {settings.colorTheme === "custom" && (
            <div className="mt-2 flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Fond
                <input
                  type="color"
                  value={settings.customBackground}
                  onChange={(e) => onChange({ customBackground: e.target.value })}
                  className="h-8 w-8 rounded border border-border bg-transparent"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Texte
                <input
                  type="color"
                  value={settings.customForeground}
                  onChange={(e) => onChange({ customForeground: e.target.value })}
                  className="h-8 w-8 rounded border border-border bg-transparent"
                />
              </label>
            </div>
          )}
        </section>

        <section>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Largeur du texte ({settings.textWidth}%)
          </p>
          <input
            type="range"
            min={40}
            max={100}
            value={settings.textWidth}
            onChange={(e) => onChange({ textWidth: Number(e.target.value) })}
            className="w-full accent-primary"
          />
        </section>

        <section>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Interligne ({settings.lineHeight.toFixed(2)})
          </p>
          <input
            type="range"
            min={1.1}
            max={2.2}
            step={0.05}
            value={settings.lineHeight}
            onChange={(e) => onChange({ lineHeight: Number(e.target.value) })}
            className="w-full accent-primary"
          />
        </section>

        <section className="flex items-center justify-between">
          <span className="text-sm font-medium">Mode miroir</span>
          <Toggle checked={settings.mirrorMode} onChange={(v) => onChange({ mirrorMode: v })} />
        </section>

        <section className="flex items-center justify-between">
          <span className="text-sm font-medium">Marqueur central</span>
          <Toggle
            checked={settings.markerEnabled}
            onChange={(v) => onChange({ markerEnabled: v })}
          />
        </section>

        <section>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Compte à rebours (enregistrement)
          </p>
          <div className="flex gap-1.5">
            {COUNTDOWNS.map((s) => (
              <button
                key={s}
                onClick={() => onChange({ countdownSeconds: s })}
                className={`flex-1 rounded-md px-2 py-1.5 text-sm ${
                  settings.countdownSeconds === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === 0 ? "Désactivé" : `${s}s`}
              </button>
            ))}
          </div>
        </section>

        <section>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Raccourcis &amp; télécommande
          </p>
          <div className="space-y-1.5 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            <Shortcut keys="Espace" action="Lecture / Pause" />
            <Shortcut keys="↑ / ↓" action="Vitesse +/-" />
            <Shortcut keys="← / →" action="Reculer / avancer 10s" />
            <Shortcut keys="M" action="Mode miroir" />
            <Shortcut keys="F" action="Plein écran" />
            <Shortcut keys="R" action="Enregistrer (mode caméra)" />
            <p className="pt-1.5 text-xs text-muted-foreground/80">
              Télécommande Bluetooth (type déclencheur photo) : le bouton
              déclenche Lecture / Pause.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function Shortcut({ keys, action }: { keys: string; action: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{action}</span>
      <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-xs text-foreground">
        {keys}
      </kbd>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition ${
        checked ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

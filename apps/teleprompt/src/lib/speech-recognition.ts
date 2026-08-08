export interface SpeechListener {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (message: string) => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

const LANGUAGE_MAP: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
  de: "de-DE",
  it: "it-IT",
  pt: "pt-PT",
};

/** Wraps SpeechRecognition in continuous mode. Browsers auto-stop recognition
 * every so often even in "continuous" mode — this transparently restarts it
 * until explicitly stopped, so callers just get an uninterrupted stream. */
export class ContinuousSpeechRecognizer {
  private recognition: SpeechRecognition | null = null;
  private stopped = true;

  constructor(
    private language: string,
    private listener: SpeechListener,
  ) {}

  start() {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      this.listener.onError?.("Reconnaissance vocale non disponible sur ce navigateur.");
      return;
    }
    this.stopped = false;
    this.recognition = new Ctor();
    this.recognition.lang = LANGUAGE_MAP[this.language] ?? "fr-FR";
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        this.listener.onResult(result[0].transcript, result.isFinal);
      }
    };
    this.recognition.onerror = (event) => {
      // "no-speech" fires continuously during natural pauses — not an error.
      if (event.error !== "no-speech") {
        this.listener.onError?.(event.error);
      }
    };
    this.recognition.onend = () => {
      if (!this.stopped) {
        try {
          this.recognition?.start();
        } catch {
          // a start()/stop() race — the next onend will retry
        }
      }
    };

    try {
      this.recognition.start();
    } catch {
      // ignore double-start races
    }
  }

  stop() {
    this.stopped = true;
    this.recognition?.stop();
    this.recognition = null;
  }
}

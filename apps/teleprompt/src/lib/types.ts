export type ColorTheme = "classic" | "yellow" | "light" | "custom";

export interface Script {
  id: string;
  title: string;
  content: string;
  language: string;
  category: string;
  notes: string;
  wordsPerMinute: number;
  createdAt: number;
  updatedAt: number;
}

export interface ScriptSettings {
  scriptId: string;
  fontSize: number;
  lineHeight: number;
  textWidth: number;
  colorTheme: ColorTheme;
  customBackground: string;
  customForeground: string;
  scrollSpeed: number;
  mirrorMode: boolean;
  markerEnabled: boolean;
  countdownSeconds: 0 | 3 | 5 | 10;
}

export const DEFAULT_SETTINGS: Omit<ScriptSettings, "scriptId"> = {
  fontSize: 48,
  lineHeight: 1.5,
  textWidth: 80,
  colorTheme: "classic",
  customBackground: "#000000",
  customForeground: "#ffffff",
  scrollSpeed: 1,
  mirrorMode: false,
  markerEnabled: true,
  countdownSeconds: 3,
};

export interface PrompterSession {
  scriptId: string;
  position: number;
  speed: number;
  updatedAt: number;
}

export interface Recording {
  id: string;
  scriptId: string;
  scriptTitle: string;
  title: string;
  duration: number;
  resolution: string;
  mimeType: string;
  createdAt: number;
}

export const WPM_OPTIONS = [100, 120, 150, 180, 200] as const;

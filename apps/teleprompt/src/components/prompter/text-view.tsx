"use client";

import { forwardRef, useMemo } from "react";
import { ColorTheme, ScriptSettings } from "@/lib/types";

const THEME_COLORS: Record<Exclude<ColorTheme, "custom">, { bg: string; fg: string }> = {
  classic: { bg: "#000000", fg: "#ffffff" },
  yellow: { bg: "#000000", fg: "#ffde59" },
  light: { bg: "#ffffff", fg: "#0a0a0a" },
};

export function themeColors(settings: ScriptSettings) {
  if (settings.colorTheme === "custom") {
    return { bg: settings.customBackground, fg: settings.customForeground };
  }
  return THEME_COLORS[settings.colorTheme];
}

interface TextViewProps {
  content: string;
  settings: ScriptSettings;
  paddingTop: number;
  paddingBottom: number;
  transform: number;
}

export const TeleprompterTextView = forwardRef<HTMLDivElement, TextViewProps>(
  function TeleprompterTextView({ content, settings, paddingTop, paddingBottom, transform }, ref) {
    const { bg, fg } = themeColors(settings);
    const paragraphs = useMemo(() => content.split(/\n/), [content]);

    return (
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ background: bg, transform: settings.mirrorMode ? "scaleX(-1)" : undefined }}
      >
        <div
          ref={ref}
          className="absolute left-1/2 will-change-transform"
          style={{
            top: 0,
            transform: `translate(-50%, ${-transform}px)`,
            width: `${settings.textWidth}%`,
            maxWidth: "1100px",
            paddingTop,
            paddingBottom,
            color: fg,
            fontSize: settings.fontSize,
            lineHeight: settings.lineHeight,
            textAlign: "center",
            fontWeight: 600,
          }}
        >
          {paragraphs.map((line, i) => (
            <p key={i} className={line.trim() === "" ? "h-[0.6em]" : undefined}>
              {line || " "}
            </p>
          ))}
        </div>
      </div>
    );
  },
);

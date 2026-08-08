import type { SVGProps } from "react";

/** Minimal Lucide-style stroke icon set — no icon-font/emoji dependency. */
function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

export const PlusIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const PlayIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M6 4l14 8-14 8V4z" fill="currentColor" stroke="none" />
  </Icon>
);
export const PauseIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none" />
    <rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none" />
  </Icon>
);
export const RecordIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8" fill="currentColor" stroke="none" />
  </Icon>
);
export const StopIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" stroke="none" />
  </Icon>
);
export const CameraIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
    <circle cx="12" cy="13" r="3.5" />
  </Icon>
);
export const MicIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0M12 19v3M9 22h6" />
  </Icon>
);
export const SettingsIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Icon>
);
export const ChevronLeftIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M15 18l-6-6 6-6" />
  </Icon>
);
export const TrashIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16z" />
  </Icon>
);
export const DownloadIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M12 3v12m0 0-4-4m4 4 4-4M4 19h16" />
  </Icon>
);
export const FlipHorizontalIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M12 3v18M17 6l3 3-3 3M7 6l-3 3 3 3M18 15l2 3-2 3M6 15l-2 3 2 3" />
  </Icon>
);
export const MaximizeIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
  </Icon>
);
export const MinimizeIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M8 3v3a2 2 0 0 1-2 2H3M16 3v3a2 2 0 0 0 2 2h3M8 21v-3a2 2 0 0 0-2-2H3M16 21v-3a2 2 0 0 1 2-2h3" />
  </Icon>
);
export const RewindIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M11 19V5l-8 7 8 7zM21 19V5l-8 7 8 7z" fill="currentColor" stroke="none" />
  </Icon>
);
export const ForwardIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M13 5v14l8-7-8-7zM3 5v14l8-7-8-7z" fill="currentColor" stroke="none" />
  </Icon>
);
export const VideoIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <rect x="2" y="6" width="14" height="12" rx="2" />
    <path d="M16 10l6-3v10l-6-3" />
  </Icon>
);
export const SmartFollowIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0" />
    <path d="M3 6q2-2 3 0t3 0t3 0t3 0t3 0" />
  </Icon>
);
export const HistoryIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7M3 5v5h5" />
    <path d="M12 7v5l3 3" />
  </Icon>
);
export const UploadIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </Icon>
);
export const LoaderIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M12 3a9 9 0 1 0 9 9" />
  </Icon>
);
export const AlignCenterIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M17 6H7M19 12H5M17 18H7" />
  </Icon>
);

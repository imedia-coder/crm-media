"use client";

export function CountdownOverlay({ value }: { value: number }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
      <span key={value} className="animate-[pulse_1s_ease-in-out] text-8xl font-bold text-white">
        {value === 0 ? "GO" : value}
      </span>
    </div>
  );
}

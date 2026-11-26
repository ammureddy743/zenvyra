export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Subtle Studio Grid */}
      <div className="absolute inset-0 bg-studio-grid opacity-60 dark:opacity-50" />

      {/* Top-Left Violet Glow */}
      <div className="animate-ambient-1 absolute -top-32 -left-24 h-[460px] w-[460px] rounded-full bg-violet-500/15 dark:bg-violet-600/20 blur-3xl" />

      {/* Top-Right Cyan Glow */}
      <div className="animate-ambient-2 absolute top-16 -right-24 h-[420px] w-[420px] rounded-full bg-cyan-400/15 dark:bg-cyan-500/15 blur-3xl" />

      {/* Lower-Center Fuchsia Glow */}
      <div className="animate-ambient-3 absolute -bottom-40 left-1/3 h-[500px] w-[500px] rounded-full bg-fuchsia-500/10 dark:bg-fuchsia-600/15 blur-3xl" />
    </div>
  );
}

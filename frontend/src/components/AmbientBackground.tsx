export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-gradient-to-br from-[#eef2ff] via-[#f4f6fb] to-[#e6f7fa] dark:from-[#070913] dark:via-[#0b0f1e] dark:to-[#07131d]"
    >
      {/* Subtle Studio Grid */}
      <div className="absolute inset-0 bg-studio-grid opacity-75 dark:opacity-60" />

      {/* Animated Top-Left Indigo/Violet Glow */}
      <div className="animate-ambient-1 absolute -top-24 -left-20 h-[520px] w-[520px] rounded-full bg-indigo-500/30 dark:bg-violet-600/35 blur-3xl will-change-transform" />

      {/* Animated Top-Right Teal/Sky Glow */}
      <div className="animate-ambient-2 absolute top-10 -right-20 h-[480px] w-[480px] rounded-full bg-sky-400/30 dark:bg-cyan-500/30 blur-3xl will-change-transform" />

      {/* Animated Bottom-Center Rose/Violet Glow */}
      <div className="animate-ambient-3 absolute -bottom-32 left-1/4 h-[540px] w-[540px] rounded-full bg-fuchsia-400/25 dark:bg-fuchsia-600/30 blur-3xl will-change-transform" />
    </div>
  );
}

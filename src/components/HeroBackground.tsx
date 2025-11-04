/**
 * HeroBackground Component
 * Cinematic fog and stars background for the create page
 */

export default function HeroBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      {/* fog layers (pngs or gradients) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* top-right warm haze */}
        <div className="absolute -right-20 -top-24 h-[60vh] w-[60vw] rounded-full bg-[radial-gradient(closest-side,rgba(247,180,76,.12),transparent_70%)] blur-2xl" />
        {/* left cool haze */}
        <div className="absolute -left-32 top-10 h-[70vh] w-[60vw] rounded-full bg-[radial-gradient(closest-side,rgba(104,89,210,.18),transparent_70%)] blur-2xl" />
      </div>

      {/* vignette */}
      <div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(70%_70%_at_50%_40%,black,transparent_90%)] bg-black/40" />

      {/* star field */}
      <svg className="absolute inset-0 h-full w-full">
        {Array.from({ length: 140 }).map((_, i) => {
          const size = Math.random() * 1.4 + 0.2;
          const x = Math.random() * 100;
          const y = Math.random() * 100;
          const delay = (Math.random() * 2).toFixed(2);
          return (
            <circle
              key={i}
              cx={`${x}%`}
              cy={`${y}%`}
              r={size}
              className="animate-twinkle"
              style={{ animationDelay: `${delay}s` }}
              fill="#F2B544"
              opacity={0.5}
            />
          );
        })}
      </svg>

      {/* slow-floating mist layer */}
      <div className="absolute inset-x-0 bottom-0 h-[40vh] bg-[radial-gradient(60%_60%_at_50%_100%,rgba(204,191,255,.18),transparent_70%)] blur-2xl animate-float" />
    </div>
  );
}


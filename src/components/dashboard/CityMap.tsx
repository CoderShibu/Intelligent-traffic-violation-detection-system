import { useVigilens } from "@/lib/mock/store";

export function CityMap() {
  const cameras = useVigilens(s => s.cameras);
  return (
    <div className="relative aspect-[4/3] w-full rounded-xl border border-border overflow-hidden bg-[#0c1224]">
      {/* grid */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        <defs>
          <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.2" />
          </pattern>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />
        {/* Stylized roads */}
        <g stroke="rgba(59,130,246,0.25)" strokeWidth="0.6" fill="none">
          <path d="M0,30 L100,28" />
          <path d="M0,55 L100,58" />
          <path d="M0,80 L100,78" />
          <path d="M25,0 L28,100" />
          <path d="M55,0 L52,100" />
          <path d="M80,0 L82,100" />
          <path d="M10,10 Q50,50 95,90" strokeDasharray="0.6 0.6" />
        </g>
        {/* river-ish curve */}
        <path d="M0,90 Q40,70 60,85 T100,75" stroke="rgba(96,165,250,0.15)" strokeWidth="2" fill="none" />

        {/* cameras */}
        {cameras.map(c => (
          <g key={c.id}>
            <circle cx={c.x} cy={c.y} r="3.5" fill="url(#glow)" />
            <circle cx={c.x} cy={c.y} r="0.9" fill="#3b82f6">
              <animate attributeName="r" values="0.9;1.6;0.9" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.5;1" dur="2.4s" repeatCount="indefinite" />
            </circle>
          </g>
        ))}
      </svg>
      <div className="absolute top-3 left-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground bg-background/60 backdrop-blur px-2 py-1 rounded border border-border">
        Bengaluru · Camera Grid
      </div>
      <div className="absolute bottom-3 right-3 flex items-center gap-2 text-xs bg-background/60 backdrop-blur px-2 py-1 rounded border border-border">
        <span className="dot bg-primary pulse-dot text-primary" />
        <span className="text-muted-foreground">{cameras.length} active feeds</span>
      </div>
    </div>
  );
}

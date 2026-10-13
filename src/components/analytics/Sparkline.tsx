export function Sparkline({ data, width = 96, height = 24 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const r = max - min || 1;
  const pts = data.map((d, i) => [(i / (data.length - 1)) * width, height - 2 - ((d - min) / r) * (height - 4)] as const);
  const path = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1]!;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible text-muted-foreground" aria-hidden>
      <path d={path} fill="none" stroke="currentColor" strokeWidth={1} />
      <circle cx={last[0]} cy={last[1]} r={1.75} className="fill-foreground" />
    </svg>
  );
}

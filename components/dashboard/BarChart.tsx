import type { DashboardSegment } from "@/lib/dashboard-stats";

type BarChartProps = Readonly<{
  segments: DashboardSegment[];
  emptyLabel?: string;
}>;

export function BarChart({ segments, emptyLabel = "No hay datos para mostrar." }: BarChartProps) {
  if (segments.length === 0) {
    return <p className="field-hint dash-chart-empty">{emptyLabel}</p>;
  }

  const max = Math.max(...segments.map((segment) => segment.count), 1);

  return (
    <div className="dash-bars">
      {segments.map((segment) => (
        <div key={segment.key} className="dash-bar">
          <div className="dash-bar__head">
            <span className="dash-bar__label">{segment.label}</span>
            <span className="dash-bar__meta">
              {segment.count} · {segment.pct}%
            </span>
          </div>
          <div className="dash-bar__track">
            <div
              className="dash-bar__fill"
              style={{
                width: `${(segment.count / max) * 100}%`,
                backgroundColor: segment.color
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

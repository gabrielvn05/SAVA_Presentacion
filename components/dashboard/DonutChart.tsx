import type { DashboardSegment } from "@/lib/dashboard-stats";

type DonutChartProps = Readonly<{
  segments: DashboardSegment[];
  totalLabel?: string;
}>;

export function DonutChart({ segments, totalLabel = "Total" }: DonutChartProps) {
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  if (total === 0) {
    return (
      <div className="dash-donut dash-donut--empty">
        <svg viewBox="0 0 120 120" aria-hidden>
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="14" />
        </svg>
        <div className="dash-donut__center">
          <strong>0</strong>
          <span>Sin datos</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-donut">
      <svg viewBox="0 0 120 120" aria-hidden>
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#eef2f7" strokeWidth="14" />
        {segments.map((segment) => {
          const length = (segment.count / total) * circumference;
          const dashArray = `${length} ${circumference - length}`;
          const dashOffset = -offset;
          offset += length;

          return (
            <circle
              key={segment.key}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="14"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 60 60)"
            />
          );
        })}
      </svg>
      <div className="dash-donut__center">
        <strong>{total}</strong>
        <span>{totalLabel}</span>
      </div>
    </div>
  );
}

type MetricCardProps = Readonly<{
  label: string;
  value: string | number;
  hint?: string;
  pct?: number;
  accent?: "primary" | "success" | "warning" | "danger" | "info";
}>;

const ACCENT_CLASS: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  primary: "dash-metric--primary",
  success: "dash-metric--success",
  warning: "dash-metric--warning",
  danger: "dash-metric--danger",
  info: "dash-metric--info"
};

export function MetricCard({ label, value, hint, pct, accent = "primary" }: MetricCardProps) {
  return (
    <article className={`card dash-metric ${ACCENT_CLASS[accent]}`}>
      <span className="dash-metric__label">{label}</span>
      <div className="dash-metric__row">
        <strong className="dash-metric__value">{value}</strong>
        {typeof pct === "number" ? <span className="dash-metric__pct">{pct}%</span> : null}
      </div>
      {hint ? <p className="dash-metric__hint">{hint}</p> : null}
    </article>
  );
}

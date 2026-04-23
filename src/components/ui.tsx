import type { ReactNode } from "react";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import type { AppButtonProps, StatusTone, TableColumn } from "../types";
import { cn } from "../lib/utils";

const toneClasses: Record<StatusTone, string> = {
  neutral: "bg-white/5 text-textSecondary border-white/10",
  accent: "bg-accentSoft text-[#CFC5FF] border-[#4B3BB3]",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  info: "bg-info/10 text-info border-info/20"
};

export function PageIntro({
  title,
  description,
  actions
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-text">{title}</h1>
        <p className="max-w-3xl text-sm font-medium text-textSecondary">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}

export function Card({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card shadow-panel transition duration-200 hover:-translate-y-0.5 hover:border-borderStrong hover:shadow-lift",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  trailing
}: {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/5 px-5 py-4">
      <div>
        <h3 className="text-base font-semibold text-text">{title}</h3>
        {subtitle ? <p className="mt-1 text-xs font-medium text-textMuted">{subtitle}</p> : null}
      </div>
      {trailing}
    </div>
  );
}

export function SectionTitle({
  title,
  detail
}: {
  title: string;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <h2 className="text-xl font-semibold text-text">{title}</h2>
        {detail ? <p className="mt-1 text-xs text-textMuted">{detail}</p> : null}
      </div>
      <button className="inline-flex items-center gap-1 text-xs font-semibold text-textMuted transition hover:text-textSecondary">
        View all
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function Badge({
  label,
  tone = "neutral"
}: {
  label: string;
  tone?: StatusTone;
}) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", toneClasses[tone])}>
      {label}
    </span>
  );
}

export function ProgressBar({
  value,
  tone = "accent"
}: {
  value: number;
  tone?: "accent" | "success" | "warning";
}) {
  const barTone = tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-accent";

  return (
    <div className="h-2 rounded-full bg-white/6">
      <div className={cn("h-2 rounded-full transition-all", barTone)} style={{ width: `${value}%` }} />
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: AppButtonProps) {
  const styles = {
    primary: "bg-accent text-white hover:bg-accentHover",
    secondary: "border border-borderStrong bg-elevated text-textSecondary hover:bg-hover hover:text-text",
    ghost: "bg-transparent text-textSecondary hover:bg-hover hover:text-text"
  };

  return (
    <button
      {...props}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        styles[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function MetricTile({
  label,
  value,
  detail,
  tone = "neutral",
  sparkline
}: {
  label: string;
  value: string;
  detail: string;
  tone?: StatusTone;
  sparkline?: number[];
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-textMuted">{label}</p>
          <p className="text-3xl font-bold text-text">{value}</p>
          <Badge label={detail} tone={tone} />
        </div>
        {sparkline ? <Sparkline values={sparkline} /> : null}
      </div>
    </Card>
  );
}

export function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const path = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 26 - ((value - min) / Math.max(max - min, 1)) * 20;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 30" className="h-12 w-24">
      <path d={path} fill="none" stroke="#7C5CFF" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Bars({ values, colors }: { values: number[]; colors: string[] }) {
  const max = Math.max(...values);
  return (
    <div className="flex h-56 items-end gap-3">
      {values.map((value, index) => (
        <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center gap-3">
          <div className="w-full rounded-t-2xl" style={{ height: `${(value / max) * 100}%`, background: colors[index % colors.length] }} />
          <span className="text-xs text-textMuted">W{index + 1}</span>
        </div>
      ))}
    </div>
  );
}

export function SegmentedTabs({
  tabs,
  active,
  onChange
}: {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-border bg-elevated p-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            "rounded-[10px] px-3 py-2 text-xs font-semibold transition",
            active === tab ? "bg-card text-text shadow-sm" : "text-textMuted hover:text-textSecondary",
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

export function SimpleTable<T>({
  columns,
  rows
}: {
  columns: TableColumn<T>[];
  rows: T[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-white/3">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-textMuted"
                  style={{ width: column.width }}
                >
                  {column.label}
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-white/5 transition hover:bg-hover/70">
                {columns.map((column) => (
                  <td key={String(column.key)} className="whitespace-nowrap px-4 py-4 text-sm font-medium text-textSecondary">
                    {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key as string] ?? "")}
                  </td>
                ))}
                <td className="px-4 py-4 text-right">
                  <button className="rounded-lg p-2 text-textMuted transition hover:bg-white/5 hover:text-textSecondary">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MiniList({
  items
}: {
  items: ReadonlyArray<{ title: string; meta: string; trailing?: ReactNode }>;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={`${item.title}-${item.meta}`} className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-text">{item.title}</p>
            <p className="mt-1 text-xs text-textMuted">{item.meta}</p>
          </div>
          {item.trailing}
        </div>
      ))}
    </div>
  );
}

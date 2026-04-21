import { Box } from "@mui/material";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const tooltipStyle = {
  background: "#101826",
  border: "1px solid rgba(148,163,184,0.12)",
  borderRadius: 12,
  color: "#eef2ff",
};

const placeholderAxis = [
  { name: "Week 1", revenue: 18, expense: 9, profit: 9 },
  { name: "Week 2", revenue: 22, expense: 11, profit: 11 },
  { name: "Week 3", revenue: 19, expense: 9.5, profit: 9.5 },
  { name: "Week 4", revenue: 25, expense: 12.5, profit: 12.5 },
];

export function BudgetTrendChart({ data }) {
  return (
    <Box sx={{ height: 160, mt: 1 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="spendGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#7c83ff" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#7c83ff" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey="spend" stroke="#7c83ff" fill="url(#spendGradient)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}

export function BudgetComparisonChart({ data }) {
  const safeData = data?.length ? data : placeholderAxis;
  return (
    <Box sx={{ height: 220, mt: 0.5 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={safeData}>
          <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
          <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="revenue" stroke="#8a8eff" strokeWidth={2.2} dot={false} />
          <Line type="monotone" dataKey="expense" stroke="#727b92" strokeWidth={1.8} dot={false} />
          <Line type="monotone" dataKey="profit" stroke="#d8dde9" strokeWidth={1.8} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}

export function BudgetDonutChart({
  data,
  width = 196,
  height = 196,
  innerRadius = 58,
  outerRadius = 82,
}) {
  const total = (data || []).reduce((sum, item) => sum + Math.max(Number(item.value) || 0, 0), 0);
  const safeData =
    total > 0
      ? data.filter((item) => Number(item.value) > 0)
      : [{ name: "Empty", value: 1, fill: "#232d45" }];

  return (
    <Box sx={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={safeData}
            dataKey="value"
            nameKey="name"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={total > 0 ? 3 : 0}
            stroke="none"
            isAnimationActive={total > 0}
          />
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
}

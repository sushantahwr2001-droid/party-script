import { Box } from "@mui/material";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";

const tooltipStyle = {
  background: "#0f172a",
  border: "1px solid rgba(148,163,184,0.12)",
  borderRadius: 12,
};

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
          <XAxis dataKey="name" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey="spend" stroke="#7c83ff" fill="url(#spendGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}

export function BudgetComparisonChart({ data }) {
  return (
    <Box sx={{ height: 160, mt: 0.5 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="budget" fill="#1d4ed8" radius={[5, 5, 0, 0]} />
          <Bar dataKey="spend" fill="#7c83ff" radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

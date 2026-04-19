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
  CartesianGrid,
} from "recharts";

const tooltipStyle = {
  background: "#1e1c23",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 14,
  color: "#f5f7ff",
};

export function BudgetTrendChart({ data }) {
  return (
    <Box sx={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="spendGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#6f72ff" stopOpacity={0.42} />
              <stop offset="100%" stopColor="#6f72ff" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="name" stroke="#7c7f8c" tickLine={false} axisLine={false} />
          <YAxis stroke="#7c7f8c" tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area
            type="monotone"
            dataKey="spend"
            stroke="#6f72ff"
            strokeWidth={2}
            fill="url(#spendGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}

export function BudgetComparisonChart({ data }) {
  return (
    <Box sx={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="name" stroke="#7c7f8c" tickLine={false} axisLine={false} />
          <YAxis stroke="#7c7f8c" tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="budget" fill="#2d6bff" radius={[6, 6, 0, 0]} />
          <Bar dataKey="spend" fill="#6f72ff" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

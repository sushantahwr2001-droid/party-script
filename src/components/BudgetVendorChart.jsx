import { Box } from "@mui/material";
import {
  BarChart,
  Bar,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const tooltipStyle = {
  background: "#0f172a",
  border: "1px solid rgba(148,163,184,0.12)",
  borderRadius: 12,
};

export default function BudgetVendorChart({ data }) {
  return (
    <Box sx={{ height: 260, mt: 0.8 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(148,163,184,0.1)" vertical={false} />
          <XAxis dataKey="name" stroke="#8a94ab" tickLine={false} axisLine={false} />
          <YAxis stroke="#8a94ab" tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="cost" fill="#5c63f4" radius={[6, 6, 0, 0]} maxBarSize={120}>
            <LabelList
              dataKey="cost"
              position="top"
              formatter={(value) =>
                new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                }).format(Number(value) || 0)
              }
              fill="#eef2ff"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

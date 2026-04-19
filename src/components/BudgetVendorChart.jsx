import { Box } from "@mui/material";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

const tooltipStyle = {
  background: "#1e1c23",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 14,
  color: "#f5f7ff",
};

export default function BudgetVendorChart({ data }) {
  return (
    <Box sx={{ height: 240, mt: 1.1 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="name" stroke="#7c7f8c" tickLine={false} axisLine={false} />
          <YAxis stroke="#7c7f8c" tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="cost" fill="#55b7ff" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

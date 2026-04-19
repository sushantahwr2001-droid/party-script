import { Box } from "@mui/material";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const tooltipStyle = {
  background: "#0f172a",
  border: "1px solid rgba(148,163,184,0.12)",
  borderRadius: 12,
};

export default function BudgetVendorChart({ data }) {
  return (
    <Box sx={{ height: 160, mt: 0.6 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="cost" fill="#60a5fa" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

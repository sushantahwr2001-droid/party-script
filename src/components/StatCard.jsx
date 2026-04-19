import { Box, Typography } from "@mui/material";

export default function StatCard({ title, value }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid #1e293b",
        background: "#020617",
        minHeight: "80px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: "#64748b", mb: 0.5 }}
      >
        {title}
      </Typography>

      <Typography
        sx={{
          fontSize: "20px",
          fontWeight: 600,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
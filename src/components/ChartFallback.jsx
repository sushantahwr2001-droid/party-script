import { Box, Card, Typography } from "@mui/material";

export default function ChartFallback({ height = 160 }) {
  return (
    <Card
      sx={{
        height,
        display: "grid",
        placeItems: "center",
        background: "rgba(8,15,30,0.42)",
        border: "1px solid rgba(148,163,184,0.08)",
        borderRadius: 2,
      }}
    >
      <Box textAlign="center">
        <Typography fontSize={12} fontWeight={700}>
          Loading chart
        </Typography>
        <Typography fontSize={11} color="text.secondary" mt={0.4}>
          Preparing analytics view
        </Typography>
      </Box>
    </Card>
  );
}

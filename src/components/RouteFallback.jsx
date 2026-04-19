import { Box, Card, Typography } from "@mui/material";

export default function RouteFallback() {
  return (
    <Box
      sx={{
        height: "100%",
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 320,
          p: 2,
          textAlign: "center",
        }}
      >
        <Typography fontSize={16} fontWeight={700}>
          Loading workspace
        </Typography>
        <Typography fontSize={12} color="text.secondary" mt={0.75}>
          Preparing the next screen.
        </Typography>
      </Card>
    </Box>
  );
}

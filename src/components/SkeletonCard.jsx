import { Card, Box, Skeleton } from "@mui/material";

export default function SkeletonCard() {
  return (
    <Card
      sx={{
        p: 2,
        borderRadius: 3,
        background: "rgba(2,6,23,0.6)",
        border: "1px solid rgba(148,163,184,0.1)",
      }}
    >
      <Skeleton width="60%" height={20} />
      <Skeleton width="40%" height={15} />
      <Skeleton width="30%" height={15} />

      <Box mt={1}>
        <Skeleton width="50%" height={15} />
      </Box>
    </Card>
  );
}
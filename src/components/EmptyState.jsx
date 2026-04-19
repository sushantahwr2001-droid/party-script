import { Box, Button, Typography } from "@mui/material";

export default function EmptyState({ title, subtitle, actionLabel, onAction }) {
  return (
    <Box
      sx={{
        textAlign: "center",
        py: 2,
        px: 1.2,
        border: "1px dashed #1e293b",
        borderRadius: 2,
        background: "rgba(2,6,23,0.36)",
        display: "grid",
        gap: 0.75,
        justifyItems: "center",
      }}
    >
      <Typography fontSize={14} fontWeight={600}>
        {title}
      </Typography>

      <Typography fontSize={12} color="#94a3b8">
        {subtitle}
      </Typography>

      {actionLabel && onAction ? (
        <Button size="small" variant="outlined" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </Box>
  );
}

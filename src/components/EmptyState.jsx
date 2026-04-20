import { Box, Button, IconButton, Tooltip, Typography } from "@mui/material";

export default function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
  actionIcon = null,
  actionTooltip = "",
  compactAction = false,
}) {
  return (
    <Box
      sx={{
        textAlign: "center",
        py: 2,
        px: 1.2,
        border: (theme) => `1px dashed ${theme.palette.divider}`,
        borderRadius: 2,
        background: (theme) =>
          theme.palette.mode === "light" ? "rgba(79,99,255,0.04)" : "rgba(2,6,23,0.36)",
        display: "grid",
        gap: 0.75,
        justifyItems: "center",
      }}
    >
      <Typography fontSize={14} fontWeight={600}>
        {title}
      </Typography>

      <Typography fontSize={12} color="text.secondary">
        {subtitle}
      </Typography>

      {actionLabel && onAction ? (
        compactAction && actionIcon ? (
          <Tooltip title={actionTooltip || actionLabel}>
            <IconButton
              size="small"
              onClick={onAction}
              sx={(theme) => ({
                width: 36,
                height: 36,
                borderRadius: 1.8,
                border: `1px solid ${theme.palette.divider}`,
                background:
                  theme.palette.mode === "light" ? "rgba(79,99,255,0.06)" : "#101826",
                color: theme.palette.text.secondary,
                "&:hover": {
                  background:
                    theme.palette.mode === "light" ? "rgba(79,99,255,0.12)" : "#151f33",
                  color: theme.palette.primary.main,
                },
              })}
            >
              {actionIcon}
            </IconButton>
          </Tooltip>
        ) : (
          <Button size="small" variant="outlined" onClick={onAction}>
            {actionLabel}
          </Button>
        )
      ) : null}
    </Box>
  );
}

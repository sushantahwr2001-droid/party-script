import { Typography, Box } from "@mui/material";

export default function PageHeader({ title, subtitle }) {
  return (
    <Box mb={4}>
      <Typography
        variant="h4"
        fontWeight={600}
        sx={{
          letterSpacing: "-0.5px",
        }}
      >
        {title}
      </Typography>

      {subtitle && (
        <Typography
          sx={{
            color: "#94a3b8", // softer gray (better than "gray")
            fontSize: "14px",
            mt: 0.5,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
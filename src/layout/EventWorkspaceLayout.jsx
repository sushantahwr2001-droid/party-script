import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import { useSearchParams } from "react-router-dom";

export default function EventWorkspaceLayout({
  event,
  children,
  tabs = [],
  overallProgress = 0,
  summary = null,
  vendorCount = 0,
  onQuickAction,
  quickActionPermissions = {},
}) {
  const [value, setValue] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();

  const totalSpent = summary?.spent || 0;
  const completedTasks = summary?.completedTasks || 0;
  const totalTasks = summary?.taskCount || 0;

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (!tabParam) {
      return;
    }

    const matchedIndex = tabs.findIndex(
      (tab) => tab.toLowerCase() === tabParam.toLowerCase()
    );

    if (matchedIndex >= 0) {
      setValue(matchedIndex);
    }
  }, [searchParams, tabs]);

  const quickActions = useMemo(
    () => [
      {
        label: "+ Contact",
        tab: "Contacts",
        variant: "outlined",
        disabled: quickActionPermissions.contacts === false,
      },
      {
        label: "+ Vendor",
        tab: "Vendors",
        variant: "outlined",
        disabled: quickActionPermissions.vendors === false,
      },
      {
        label: "+ Task",
        tab: "Tasks",
        variant: "outlined",
        disabled: quickActionPermissions.tasks === false,
      },
      {
        label: "+ Document",
        tab: "Documents",
        variant: "contained",
        disabled: quickActionPermissions.documents === false,
      },
    ],
    [quickActionPermissions]
  );

  const openTab = (tabLabel) => {
    const nextIndex = tabs.findIndex((tab) => tab === tabLabel);
    if (nextIndex >= 0) {
      setValue(nextIndex);
      setSearchParams({ tab: tabLabel });
    }
  };

  const triggerAction = (action) => {
    openTab(action.tab);
    onQuickAction?.(action.tab);
  };

  const stats = [
    {
      label: "Progress",
      value: `${Math.round(overallProgress)}%`,
      caption: `${Math.round(overallProgress)}% complete`,
      helper: `${completedTasks}/${totalTasks} tasks complete`,
    },
    {
      label: "Vendors",
      value: vendorCount,
      caption: "Active relationships",
    },
    {
      label: "Budget",
      value: formatCurrency(event?.budget - totalSpent),
      caption: "Remaining",
    },
  ];

  return (
    <Box
      sx={{
        px: { xs: 0, md: 0.5 },
        py: 0.5,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box sx={headerShell}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", xl: "center" },
            flexDirection: { xs: "column", xl: "row" },
            gap: 1.2,
          }}
        >
          <Box sx={{ width: "100%" }}>
            <Typography sx={titleText}>{event?.name}</Typography>
            <Typography sx={subtitleText}>
              {event?.notes ||
                "Operations workspace for coordinating deadlines, suppliers, budgets, and documents without losing context."}
            </Typography>

            <Box sx={{ display: "flex", gap: 0.6, mt: 0.9, flexWrap: "wrap" }}>
              <Chip label={dayjs(event?.date).format("DD MMM YYYY")} size="small" />
              <Chip label={event?.venue} size="small" />
              <Chip label={event?.status || "Planned"} size="small" sx={statusChip(event?.status)} />
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 0.6, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant}
                size="small"
                disabled={action.disabled}
                onClick={() => triggerAction(action)}
              >
                {action.label}
              </Button>
            ))}
          </Box>
        </Box>

        <Box sx={statsGrid}>
          {stats.map((stat) => (
            <Box key={stat.label} sx={statCard}>
              <Typography sx={statLabel}>{stat.label}</Typography>
              <Typography sx={statValue}>{stat.value}</Typography>
              <Typography sx={statCaption}>{stat.caption}</Typography>
              {stat.label === "Progress" ? (
                <LinearProgress
                  variant="determinate"
                  value={overallProgress}
                  sx={{ height: 6, mt: 0.7, mb: 0.45 }}
                />
              ) : null}
              {stat.helper ? <Typography sx={statCaption}>{stat.helper}</Typography> : null}
            </Box>
          ))}
        </Box>

        <Box mt={1.1}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.4 }}>
            <Typography sx={statLabel}>Workspace completion</Typography>
            <Typography sx={statCaption}>{Math.round(overallProgress)}% ready</Typography>
          </Box>
          <LinearProgress variant="determinate" value={overallProgress} sx={{ height: 6 }} />
        </Box>

        <Tabs
          value={value}
          onChange={(_, newValue) => {
            setValue(newValue);
            setSearchParams({ tab: tabs[newValue] });
          }}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{
            mt: 1.1,
            minHeight: "auto",
            "& .MuiTabs-indicator": {
              height: 3,
              borderRadius: 999,
            },
          }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab}
              label={tab}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: 13,
                minHeight: "auto",
                px: 1.2,
                py: 0.55,
                color: "text.secondary",
              }}
            />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <motion.div
          key={tabs[value]}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16 }}
          style={{ height: "100%" }}
        >
          {children[value]}
        </motion.div>
      </Box>
    </Box>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

const headerShell = {
  flexShrink: 0,
  position: "sticky",
  top: 0,
  zIndex: 20,
  mb: 1,
  borderRadius: 3.2,
  border: "1px solid rgba(95,113,165,0.22)",
  background: "#101826",
  px: 1.5,
  py: 1.2,
  boxShadow: "0 12px 28px rgba(2, 6, 23, 0.18)",
};

const statsGrid = {
  mt: 1,
  display: "grid",
  gridTemplateColumns: {
    xs: "1fr",
    md: "repeat(3, minmax(0, 1fr))",
  },
  gap: 0.8,
};

const statCard = {
  p: 1,
  borderRadius: 2,
  background: "#0c1421",
  border: "1px solid rgba(95,113,165,0.12)",
  boxShadow: "none",
};

const titleText = {
  fontSize: 12.5,
  fontWeight: 600,
  letterSpacing: "-0.02em",
  color: "#f4f7ff",
};

const subtitleText = {
  color: "text.secondary",
  fontSize: 11,
  mt: 0.2,
  maxWidth: 700,
};

const statLabel = {
  color: "text.secondary",
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const statValue = {
  mt: 0.35,
  fontSize: 13,
  fontWeight: 650,
  color: "#f4f7ff",
};

const statCaption = {
  color: "text.secondary",
  fontSize: 11,
};

const statusChip = (status) => ({
  backgroundColor:
    status === "Live"
      ? "#133222"
      : status === "Planning"
      ? "#33280f"
      : "#16263f",
  color:
    status === "Live"
      ? "#bbf7d0"
      : status === "Planning"
      ? "#fde68a"
      : "#bfdbfe",
  border: "1px solid rgba(255,255,255,0.06)",
});

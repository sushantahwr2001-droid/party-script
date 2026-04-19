import { Box, Button, Chip, LinearProgress, Tab, Tabs, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
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

    const matchedIndex = tabs.findIndex((tab) => tab.toLowerCase() === tabParam.toLowerCase());
    if (matchedIndex >= 0) {
      setValue(matchedIndex);
    }
  }, [searchParams, tabs]);

  const quickActions = useMemo(
    () => [
      { label: "Add Contact", tab: "Contacts", variant: "outlined", disabled: quickActionPermissions.contacts === false },
      { label: "Add Vendor", tab: "Vendors", variant: "outlined", disabled: quickActionPermissions.vendors === false },
      { label: "Add Task", tab: "Tasks", variant: "outlined", disabled: quickActionPermissions.tasks === false },
      { label: "Add Document", tab: "Documents", variant: "contained", disabled: quickActionPermissions.documents === false },
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

  const stats = [
    { label: "Progress", value: `${Math.round(overallProgress)}%`, helper: `${completedTasks}/${totalTasks} tasks complete` },
    { label: "Vendors", value: vendorCount, helper: "Active relationships" },
    { label: "Remaining", value: formatCurrency(event?.budget - totalSpent), helper: "Budget available" },
  ];

  return (
    <Box sx={{ maxWidth: 1240, marginInline: "auto", pb: 3 }}>
      <Box sx={headerShell}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", xl: "center" },
            flexDirection: { xs: "column", xl: "row" },
            gap: 1.5,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={eyebrow}>Event workspace</Typography>
            <Typography sx={titleText}>{event?.name}</Typography>
            <Typography sx={subtitleText}>
              {event?.notes || "A live event workspace for timelines, vendors, budget, documents, and execution details."}
            </Typography>
            <Box sx={{ display: "flex", gap: 0.7, mt: 1, flexWrap: "wrap" }}>
              <Chip label={dayjs(event?.date).format("DD MMM YYYY")} size="small" />
              <Chip label={event?.venue} size="small" />
              <Chip label={event?.status || "Planning"} size="small" sx={statusChip(event?.status)} />
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap" }}>
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant}
                size="small"
                disabled={action.disabled}
                onClick={() => {
                  openTab(action.tab);
                  onQuickAction?.(action.tab);
                }}
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
              <Typography sx={statCaption}>{stat.helper}</Typography>
              {stat.label === "Progress" ? (
                <LinearProgress variant="determinate" value={overallProgress} sx={{ mt: 1, height: 7 }} />
              ) : null}
            </Box>
          ))}
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
            mt: 1.5,
            minHeight: "auto",
            "& .MuiTabs-flexContainer": {
              gap: 0.55,
            },
            "& .MuiTabs-indicator": {
              display: "none",
            },
          }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={tab}
              label={tab}
              sx={{
                textTransform: "none",
                minHeight: "auto",
                px: 1.4,
                py: 0.9,
                borderRadius: 2.5,
                fontSize: 12.5,
                fontWeight: value === index ? 700 : 600,
                color: value === index ? "#f5f7ff" : "text.secondary",
                background: value === index ? "rgba(95,111,255,0.14)" : "rgba(255,255,255,0.02)",
                border: value === index
                  ? "1px solid rgba(95,111,255,0.18)"
                  : "1px solid rgba(255,255,255,0.04)",
              }}
            />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ mt: 1.25 }}>
        {children[value]}
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
  p: 1.5,
  borderRadius: 4,
  border: "1px solid rgba(255,255,255,0.06)",
  background: "linear-gradient(180deg, rgba(33,31,39,0.98), rgba(29,27,34,0.98))",
  boxShadow: "0 18px 45px rgba(0,0,0,0.16)",
};

const eyebrow = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  color: "text.secondary",
  mb: 0.7,
};

const titleText = {
  fontSize: { xs: 24, md: 30 },
  lineHeight: 1.02,
  letterSpacing: "-0.05em",
  fontWeight: 800,
};

const subtitleText = {
  mt: 0.7,
  maxWidth: 760,
  fontSize: 12.5,
  color: "text.secondary",
  lineHeight: 1.7,
};

const statsGrid = {
  mt: 1.5,
  display: "grid",
  gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
  gap: 1,
};

const statCard = {
  p: 1.1,
  borderRadius: 3,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.05)",
};

const statLabel = {
  fontSize: 10.5,
  color: "text.secondary",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const statValue = {
  mt: 0.65,
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: "-0.05em",
};

const statCaption = {
  mt: 0.45,
  fontSize: 11.5,
  color: "text.secondary",
};

const statusChip = (status) => ({
  background:
    status === "Live"
      ? "rgba(46,194,126,0.14)"
      : status === "Planning"
        ? "rgba(245,159,76,0.14)"
        : "rgba(85,183,255,0.14)",
  color:
    status === "Live"
      ? "#99efc5"
      : status === "Planning"
        ? "#ffd6a0"
        : "#b9e5ff",
});

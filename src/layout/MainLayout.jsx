import { motion } from "framer-motion";
import {
  Avatar,
  Box,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { Outlet, Link, useLocation } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import EventIcon from "@mui/icons-material/Event";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ChecklistIcon from "@mui/icons-material/Checklist";
import PeopleIcon from "@mui/icons-material/People";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { useAuth } from "../context/auth-context";

const primaryMenu = [
  { label: "Dashboard", path: "/", icon: <DashboardIcon /> },
  { label: "Events", path: "/events", icon: <EventIcon /> },
  { label: "Calendar", path: "/calendar", icon: <CalendarMonthIcon /> },
];

const secondaryMenu = [
  { label: "Tasks", path: "/tasks", icon: <ChecklistIcon /> },
  { label: "Vendors", path: "/vendors", icon: <PeopleIcon /> },
  { label: "Budget", path: "/budget", icon: <AccountBalanceWalletIcon /> },
];

export default function MainLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: 248,
          flexShrink: 0,
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            width: 248,
            background:
              "linear-gradient(180deg, rgba(8,12,26,0.99), rgba(10,15,30,0.98))",
            borderRight: "1px solid rgba(92,108,154,0.18)",
            padding: 2,
            display: "flex",
            flexDirection: "column",
            boxShadow: "inset -1px 0 0 rgba(255,255,255,0.02)",
          },
        }}
      >
        <Box px={1} mb={2.5}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.1, mb: 0.75 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: 13,
                fontWeight: 800,
                background: "#5b6cff",
              }}
            >
              PS
            </Avatar>
            <Box>
              <Typography fontWeight={600} fontSize={13.5} letterSpacing="-0.01em">
                Party Script
              </Typography>
              <Typography fontSize={11} color="text.secondary">
                Event operations
              </Typography>
            </Box>
          </Box>
        </Box>

        <List sx={{ pb: 0, flex: 1 }}>
          {primaryMenu.map((item) => {
            const active = isActive(item.path);

            return (
              <ListItemButton
                key={item.path}
                component={Link}
                to={item.path}
                sx={{
                  borderRadius: 2,
                  mb: 0.35,
                  px: 1.3,
                  py: 0.85,
                  background: active
                    ? "linear-gradient(135deg, rgba(77,88,172,0.34), rgba(63,76,158,0.18))"
                    : "transparent",
                  border: active
                    ? "1px solid rgba(104,119,255,0.3)"
                    : "1px solid transparent",
                  "&:hover": {
                    background: active
                      ? "linear-gradient(135deg, rgba(77,88,172,0.4), rgba(63,76,158,0.22))"
                      : "rgba(148,163,184,0.08)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: active ? "#93c5fd" : "#94a3b8",
                    minWidth: 34,
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                <ListItemText
                  primary={
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: active ? 700 : 500,
                        color: active ? "#f8fafc" : "#cbd5e1",
                      }}
                    >
                      {item.label}
                    </Typography>
                  }
                />
              </ListItemButton>
            );
          })}
        </List>

        <Stack direction="row" spacing={0.6} sx={{ px: 1, pb: 1 }}>
          {secondaryMenu.map((item) => (
            <Button
              key={item.path}
              component={Link}
              to={item.path}
              size="small"
              variant="text"
              sx={{
                minWidth: 0,
                px: 0.8,
                fontSize: 11,
                color: isActive(item.path) ? "#c7d2fe" : "text.secondary",
              }}
            >
              {item.label}
            </Button>
          ))}
        </Stack>

        <Box
          sx={{
            mt: 1,
            p: 0.9,
            borderRadius: 2,
            background: "linear-gradient(180deg, rgba(10,17,33,0.82), rgba(8,14,28,0.72))",
            border: "1px solid rgba(94,114,165,0.12)",
          }}
        >
          <Typography fontSize={13} fontWeight={700}>
            {user?.name}
          </Typography>
          <Typography fontSize={11} color="text.secondary">
            {user?.role === "admin" ? "Admin access" : "Manager access"}
          </Typography>
          <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={logout}>
            Logout
          </Button>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: "100vh",
          overflow: "hidden",
          px: 1.5,
          py: 1.5,
          background:
            "radial-gradient(circle at top center, rgba(47,95,143,0.16), transparent 26%), radial-gradient(circle at top left, rgba(101,90,255,0.12), transparent 18%), linear-gradient(180deg, #08101d 0%, #091120 100%)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          style={{ height: "100%" }}
        >
          <Outlet />
        </motion.div>
      </Box>
    </Box>
  );
}

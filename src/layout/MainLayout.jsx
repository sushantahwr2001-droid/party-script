import { motion } from "framer-motion";
import {
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  InputBase,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { Outlet, Link, useLocation } from "react-router-dom";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import { useAuth } from "../context/auth-context";

const menuGroups = [
  {
    title: "Main menu",
    items: [
      { label: "Dashboard", path: "/", icon: <DashboardRoundedIcon fontSize="small" /> },
      { label: "Events", path: "/events", icon: <EventRoundedIcon fontSize="small" /> },
      { label: "Calendar", path: "/calendar", icon: <CalendarMonthRoundedIcon fontSize="small" /> },
      { label: "Tasks", path: "/tasks", icon: <ChecklistRoundedIcon fontSize="small" /> },
      { label: "Vendors", path: "/vendors", icon: <GroupsRoundedIcon fontSize="small" /> },
      { label: "Budget", path: "/budget", icon: <AccountBalanceWalletRoundedIcon fontSize="small" /> },
    ],
  },
];

const utilityItems = [
  { label: "Support", icon: <HelpOutlineRoundedIcon fontSize="small" /> },
  { label: "Settings", icon: <SettingsRoundedIcon fontSize="small" /> },
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
          width: 264,
          flexShrink: 0,
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            width: 264,
            background: "#0b0f16",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            px: 1.5,
            py: 1.6,
            display: "flex",
            flexDirection: "column",
            boxShadow: "inset -1px 0 0 rgba(255,255,255,0.02)",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1,
            mb: 1.6,
          }}
        >
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              background: "#171f31",
              color: "#8a7fff",
            }}
          >
            <BoltRoundedIcon sx={{ fontSize: 15 }} />
          </Box>
          <Typography fontWeight={700} fontSize={14.5} letterSpacing="-0.02em">
            Party Script
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.9,
            height: 42,
            px: 1.2,
            borderRadius: 2.5,
            background: "#121722",
            border: "1px solid rgba(255,255,255,0.04)",
            mb: 1.8,
          }}
        >
          <SearchRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
          <InputBase
            placeholder="Search"
            sx={{
              flex: 1,
              color: "text.primary",
              fontSize: 13,
              "& input::placeholder": {
                color: "#7f8491",
                opacity: 1,
              },
            }}
          />
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pr: 0.4 }}>
          {menuGroups.map((group) => (
            <Box key={group.title} sx={{ mb: 1.6 }}>
              <Typography
                sx={{
                  px: 1,
                  mb: 0.7,
                  color: "text.secondary",
                  fontSize: 11,
                }}
              >
                {group.title}
              </Typography>

              <List disablePadding sx={{ display: "grid", gap: 0.35 }}>
                {group.items.map((item) => {
                  const active = isActive(item.path);

                  return (
                    <ListItemButton
                      key={item.path}
                      component={Link}
                      to={item.path}
                      sx={{
                        minHeight: 42,
                        px: 1.15,
                        borderRadius: 2.5,
                        background: active ? "#1a2232" : "transparent",
                        border: active
                          ? "1px solid rgba(142, 127, 255, 0.22)"
                          : "1px solid transparent",
                        "&:hover": {
                          background: active ? "#1d2638" : "#121722",
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 30,
                          color: active ? "#f5f7ff" : "#8d93a0",
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
                              color: active ? "#f7f8ff" : "#c0c4d2",
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
            </Box>
          ))}
        </Box>

        <Box sx={{ pt: 1.2 }}>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 1.2 }} />

          <List disablePadding sx={{ display: "grid", gap: 0.2, mb: 1.3 }}>
            {utilityItems.map((item) => (
              <ListItemButton
                key={item.label}
                sx={{
                  minHeight: 38,
                  px: 1,
                  borderRadius: 2.5,
                  "&:hover": {
                    background: "#121722",
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 30, color: "#8d93a0" }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={
                    <Typography sx={{ fontSize: 12.5, color: "#bcc1ce" }}>
                      {item.label}
                    </Typography>
                  }
                />
              </ListItemButton>
            ))}
          </List>

          <Box
            sx={{
              p: 1.1,
              borderRadius: 3,
              background: "#0f1520",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  fontSize: 12,
                  fontWeight: 800,
                  background: "#5f65f6",
                }}
              >
                {(user?.name || "PS")
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography fontSize={13} fontWeight={700} noWrap>
                  {user?.name}
                </Typography>
                <Typography fontSize={11} color="text.secondary" noWrap>
                  {user?.role === "admin" ? "Admin access" : "Manager access"}
                </Typography>
              </Box>
            </Stack>

            <Button size="small" variant="outlined" sx={{ mt: 1.2, width: "100%" }} onClick={logout}>
              Logout
            </Button>
          </Box>
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
          background: "#0a0f18",
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

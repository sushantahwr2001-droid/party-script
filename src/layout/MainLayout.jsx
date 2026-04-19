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
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import Groups2RoundedIcon from "@mui/icons-material/Groups2Rounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth-context";

const menuGroups = [
  {
    title: "Main menu",
    items: [
      { label: "Dashboard", path: "/", icon: <DashboardRoundedIcon fontSize="small" /> },
      { label: "Events", path: "/events", icon: <EventRoundedIcon fontSize="small" /> },
      { label: "Calendar", path: "/calendar", icon: <CalendarMonthRoundedIcon fontSize="small" /> },
      { label: "Tasks", path: "/tasks", icon: <TaskAltRoundedIcon fontSize="small" /> },
      { label: "Vendors", path: "/vendors", icon: <Groups2RoundedIcon fontSize="small" /> },
      { label: "Budget", path: "/budget", icon: <SavingsRoundedIcon fontSize="small" /> },
    ],
  },
];

const pageTitles = {
  "/": "Dashboard",
  "/events": "Events",
  "/tasks": "Tasks",
  "/vendors": "Vendors",
  "/budget": "Budget",
  "/calendar": "Calendar",
};

function getPageTitle(pathname) {
  if (pathname.startsWith("/events/")) {
    return "Event workspace";
  }

  return pageTitles[pathname] || "Console";
}

export default function MainLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  };

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "PS";

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#17161b" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: 248,
          flexShrink: 0,
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            width: 248,
            px: 2,
            py: 2,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1,
            py: 1.25,
            borderRadius: 3,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <BoltRoundedIcon sx={{ color: "#f7f7ff", fontSize: 18 }} />
          <Typography fontWeight={700} fontSize={15}>
            Party Script
          </Typography>
        </Box>

        <Box sx={{ mt: 2, flex: 1, minHeight: 0, overflowY: "auto", pr: 0.5 }}>
          {menuGroups.map((group) => (
            <Box key={group.title} sx={{ mb: 2 }}>
              <Typography sx={{ color: "text.secondary", fontSize: 11, mb: 0.8, px: 1 }}>
                {group.title}
              </Typography>
              <List disablePadding>
                {group.items.map((item) => {
                  const active = isActive(item.path);

                  return (
                    <ListItemButton
                      key={item.path}
                      component={Link}
                      to={item.path}
                      sx={{
                        borderRadius: 2.5,
                        mb: 0.45,
                        px: 1.2,
                        minHeight: 42,
                        background: active ? "rgba(95,111,255,0.14)" : "transparent",
                        border: active
                          ? "1px solid rgba(95,111,255,0.2)"
                          : "1px solid transparent",
                        "&:hover": {
                          background: active ? "rgba(95,111,255,0.18)" : "rgba(255,255,255,0.04)",
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 30,
                          color: active ? "#dce3ff" : "text.secondary",
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
                              color: active ? "#f5f7ff" : "text.secondary",
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

        <Box
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 3,
            background: "linear-gradient(180deg, rgba(38, 36, 44, 0.98), rgba(28, 27, 33, 0.98))",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Typography fontSize={13} fontWeight={700}>
            Premium workspace
          </Typography>
          <Typography fontSize={11} color="text.secondary" mt={0.35}>
            Keep operations, budgets, and vendors in one live console.
          </Typography>

          <Divider sx={{ my: 1.5, borderColor: "rgba(255,255,255,0.06)" }} />

          <Stack direction="row" spacing={1.2} sx={{ alignItems: "center" }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                fontSize: 12,
                fontWeight: 700,
                bgcolor: "rgba(95,111,255,0.18)",
                color: "#e8edff",
              }}
            >
              {userInitials}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography fontSize={13} fontWeight={700} noWrap>
                {user?.name || "Party Script"}
              </Typography>
              <Typography fontSize={11} color="text.secondary" noWrap>
                {user?.role === "admin" ? "Admin access" : "Manager access"}
              </Typography>
            </Box>
          </Stack>

          <Button variant="outlined" size="small" onClick={logout} sx={{ mt: 1.5, width: "100%" }}>
            Logout
          </Button>
        </Box>
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            px: { xs: 2, md: 2.5 },
            py: 1.75,
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(23, 22, 27, 0.88)",
            backdropFilter: "blur(18px)",
          }}
        >
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={1.25}
            sx={{ alignItems: { xs: "stretch", lg: "center" }, justifyContent: "space-between" }}
          >
            <Typography fontSize={14} fontWeight={700}>
              {getPageTitle(location.pathname)}
            </Typography>

            <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
              <Box
                sx={{
                  minWidth: { xs: 0, sm: 220 },
                  flex: { xs: 1, sm: "none" },
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.3,
                  height: 38,
                  borderRadius: 2.5,
                  background: "#211f27",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <SearchRoundedIcon sx={{ fontSize: 17, color: "text.secondary" }} />
                <InputBase
                  placeholder="Search anything..."
                  sx={{
                    flex: 1,
                    color: "text.primary",
                    fontSize: 13,
                    "& input::placeholder": {
                      color: "#787b8a",
                      opacity: 1,
                    },
                  }}
                />
                <Typography fontSize={11} color="text.secondary">
                  ⌘K
                </Typography>
              </Box>

              <Button component={Link} to="/events" variant="outlined" startIcon={<AddRoundedIcon />}>
                Add
              </Button>
              <Button variant="contained" startIcon={<PersonAddAltRoundedIcon />}>
                Invite
              </Button>
            </Stack>
          </Stack>
        </Box>

        <Box
          component="main"
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            px: { xs: 2, md: 2.5 },
            py: 2,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

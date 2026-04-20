import { useEffect, useMemo, useState } from "react";
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
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
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
import { useEvents } from "../hooks/useEvents";
import { useTasks } from "../hooks/useTasks";
import { useVendors } from "../hooks/useVendors";

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
  { label: "Settings", icon: <SettingsRoundedIcon fontSize="small" />, path: "/settings" },
];

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { events } = useEvents();
  const { tasks } = useTasks();
  const { vendors } = useVendors();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  };

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return [];
    }

    const pageResults = [
      ...menuGroups.flatMap((group) => group.items),
      ...utilityItems.filter((item) => item.path),
    ]
      .filter((item) => item.label.toLowerCase().includes(query))
      .map((item) => ({
        id: `page-${item.path}`,
        title: item.label,
        subtitle: "Page",
        type: "Page",
        onSelect: () => navigate(item.path),
      }));

    const eventResults = events
      .filter(
        (event) =>
          event.name.toLowerCase().includes(query) ||
          event.venue.toLowerCase().includes(query) ||
          event.notes.toLowerCase().includes(query)
      )
      .map((event) => ({
        id: `event-${event.id}`,
        title: event.name,
        subtitle: `${event.venue || "No venue"} / ${event.status || "Planning"}`,
        type: "Event",
        onSelect: () => navigate(`/events/${event.id}`),
      }));

    const taskResults = tasks
      .filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.assignee.toLowerCase().includes(query) ||
          task.stage.toLowerCase().includes(query)
      )
      .map((task) => ({
        id: `task-${task.id}`,
        title: task.title,
        subtitle: `${task.stage} / ${task.assignee || "Unassigned"}`,
        type: "Task",
        onSelect: () => navigate(`/events/${task.eventId}?tab=Tasks`),
      }));

    const vendorResults = vendors
      .filter(
        (vendor) =>
          vendor.name.toLowerCase().includes(query) ||
          vendor.category.toLowerCase().includes(query) ||
          vendor.email.toLowerCase().includes(query) ||
          vendor.phone.toLowerCase().includes(query)
      )
      .map((vendor) => ({
        id: `vendor-${vendor.id}`,
        title: vendor.name,
        subtitle: `${vendor.category} / ${vendor.status}`,
        type: "Vendor",
        onSelect: () => navigate(`/events/${vendor.eventId}?tab=Vendors`),
      }));

    return [...pageResults, ...eventResults, ...taskResults, ...vendorResults].slice(0, 10);
  }, [events, navigate, searchQuery, tasks, vendors]);

  useEffect(() => {
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  const handleSearchSelect = (item) => {
    item.onSelect();
    setSearchOpen(false);
    setSearchQuery("");
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
            gap: 1.1,
            px: 1,
            mb: 1.6,
            minHeight: 38,
          }}
        >
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              background: "#151f33",
              color: "#7f85ff",
            }}
          >
            <BoltRoundedIcon sx={{ fontSize: 16 }} />
          </Box>
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#f6f8ff",
            }}
          >
            Party Script
          </Typography>
        </Box>

        <Box
          sx={{
            position: "relative",
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
            placeholder="Search console"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => {
              if (searchQuery.trim()) {
                setSearchOpen(true);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && searchResults[0]) {
                event.preventDefault();
                handleSearchSelect(searchResults[0]);
              }
              if (event.key === "Escape") {
                setSearchOpen(false);
              }
            }}
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

          {searchOpen && searchQuery.trim() ? (
            <Box sx={searchDropdown}>
              {searchResults.length > 0 ? (
                searchResults.map((item) => (
                  <Box
                    key={item.id}
                    onMouseDown={() => handleSearchSelect(item)}
                    sx={searchResultRow}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={searchResultTitle}>{item.title}</Typography>
                      <Typography sx={searchResultMeta}>{item.subtitle}</Typography>
                    </Box>
                    <Typography sx={searchResultType}>{item.type}</Typography>
                  </Box>
                ))
              ) : (
                <Box sx={searchEmpty}>
                  <Typography sx={searchResultTitle}>No results found</Typography>
                  <Typography sx={searchResultMeta}>Try searching events, tasks, vendors, or pages.</Typography>
                </Box>
              )}
            </Box>
          ) : null}
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
                onClick={item.path ? () => navigate(item.path) : undefined}
                sx={{
                  minHeight: 38,
                  px: 1,
                  borderRadius: 2.5,
                  background: item.path && isActive(item.path) ? "#1a2232" : "transparent",
                  "&:hover": {
                    background: "#121722",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 30,
                    color: item.path && isActive(item.path) ? "#f5f7ff" : "#8d93a0",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      sx={{
                        fontSize: 12.5,
                        color: item.path && isActive(item.path) ? "#f7f8ff" : "#bcc1ce",
                        fontWeight: item.path && isActive(item.path) ? 700 : 500,
                      }}
                    >
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

const searchDropdown = {
  position: "absolute",
  top: "calc(100% + 10px)",
  left: 0,
  right: 0,
  zIndex: 40,
  borderRadius: 2.8,
  background: "#101826",
  border: "1px solid rgba(95,113,165,0.18)",
  boxShadow: "0 18px 36px rgba(2, 6, 23, 0.28)",
  overflow: "hidden",
};

const searchResultRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 0.8,
  px: 1,
  py: 0.9,
  cursor: "pointer",
  borderBottom: "1px solid rgba(95,113,165,0.08)",
  "&:last-of-type": {
    borderBottom: "none",
  },
  "&:hover": {
    background: "#121d2d",
  },
};

const searchResultTitle = {
  fontSize: 12.5,
  fontWeight: 600,
  color: "#f3f6ff",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const searchResultMeta = {
  mt: 0.2,
  fontSize: 11,
  color: "text.secondary",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const searchResultType = {
  flexShrink: 0,
  fontSize: 10.5,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#8b93a8",
};

const searchEmpty = {
  px: 1,
  py: 1,
};

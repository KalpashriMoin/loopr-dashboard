import { AppBar, Toolbar, Typography, Box, Tabs, Tab, Avatar, Stack, IconButton, Menu, MenuItem, Divider } from "@mui/material";
import { InsightsRounded, Logout, KeyboardArrowDown } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Transactions", path: "/transactions" },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const activeTab = NAV_ITEMS.some((item) => item.path === location.pathname)
    ? location.pathname
    : "/dashboard";

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: "1px solid #EAEAF0" }}
    >
      <Toolbar>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ cursor: "pointer", mr: 3 }}
          onClick={() => navigate("/dashboard")}
        >
          <InsightsRounded color="primary" />
          <Typography variant="h6" whiteSpace="nowrap">
            Loopr Dashboard
          </Typography>
        </Stack>

        <Tabs
          value={activeTab}
          onChange={(_e, newValue) => navigate(newValue)}
          textColor="primary"
          indicatorColor="primary"
          sx={{ flexGrow: 1, minHeight: 48 }}
        >
          {NAV_ITEMS.map((item) => (
            <Tab key={item.path} label={item.label} value={item.path} sx={{ minHeight: 48 }} />
          ))}
        </Tabs>

        <Box flexGrow={1} />

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ cursor: "pointer" }}
          onClick={(e) => setMenuAnchor(e.currentTarget)}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
            {user?.name?.[0]?.toUpperCase() || "U"}
          </Avatar>
          <Typography variant="body2">{user?.name}</Typography>
          <IconButton size="small">
            <KeyboardArrowDown fontSize="small" />
          </IconButton>
        </Stack>
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
          <MenuItem disabled>{user?.email}</MenuItem>
          <Divider />
          <MenuItem onClick={logout}>
            <Logout fontSize="small" sx={{ mr: 1 }} /> Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
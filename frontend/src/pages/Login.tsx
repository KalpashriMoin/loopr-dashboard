import { useState, FormEvent } from "react";
import { Navigate } from "react-router-dom";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Stack,
} from "@mui/material";
import { Visibility, VisibilityOff, LockOutlined, InsightsRounded } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";

const Login = () => {
  const { login, token } = useAuth();
  const { notify } = useAlert();
  const [email, setEmail] = useState("admin@loopr.dev");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (token) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
      notify("Welcome back! Login successful.", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Login failed.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)",
        p: 2,
      }}
    >
      <Paper
        elevation={8}
        sx={{ p: 5, width: "100%", maxWidth: 420, borderRadius: 4 }}
      >
        <Stack alignItems="center" spacing={1} mb={3}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "primary.main",
              color: "white",
            }}
          >
            <InsightsRounded fontSize="large" />
          </Box>
          <Typography variant="h5">Loopr Dashboard</Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Sign in to access your financial analytics
          </Typography>
        </Stack>

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email address"
            type="email"
            required
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <TextField
            fullWidth
            label="Password"
            type={showPassword ? "text" : "password"}
            required
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlined fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((s) => !s)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isSubmitting}
            sx={{ mt: 3, py: 1.3 }}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </Box>

        <Typography variant="caption" color="text.secondary" display="block" mt={3} textAlign="center">
          Demo credentials: admin@loopr.dev / Admin@12345
          <br />
          (seeded via <code>npm run seed</code> on the backend)
        </Typography>
      </Paper>
    </Box>
  );
};

export default Login;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  TextField,
  Typography,
  Stack,
  Alert,
} from "@mui/material";
import { changePassword } from "@/services/api.service";
import { useAuthStore } from "@/stores/auth.store";

export const ChangePassword = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setSuccess("Password changed successfully!");
      
      // Update the user state locally so they are no longer forced to change password
      if (user) {
        setUser({
          ...user,
          must_change_password: false,
        });
      }

      setTimeout(() => {
        navigate("/select-restaurant");
      }, 1500);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error || err.response?.data?.errors?.join(", ") || "Failed to update password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc",
        p: 2,
      }}
    >
      <Card variant="outlined" sx={{ maxWidth: 450, width: "100%", p: 2 }}>
        <CardContent>
          <Typography variant="h5" className="font-bold text-slate-800 mb-2">
            Change Password
          </Typography>
          <Typography variant="body2" className="text-slate-600 mb-6">
            You are logging in with a temporary password and must set a new one.
          </Typography>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}

            <FormControl>
              <FormLabel htmlFor="current-password">Current Password</FormLabel>
              <TextField
                id="current-password"
                type="password"
                placeholder="••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                fullWidth
                size="small"
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="new-password">New Password</FormLabel>
              <TextField
                id="new-password"
                type="password"
                placeholder="••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                fullWidth
                size="small"
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="confirm-password">Confirm New Password</FormLabel>
              <TextField
                id="confirm-password"
                type="password"
                placeholder="••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                fullWidth
                size="small"
              />
            </FormControl>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default ChangePassword;

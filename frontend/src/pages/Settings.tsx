import { useEffect, useState } from "react";
import { getRestaurantInfo, updateRestaurantInfo, RestaurantInfo } from "@/services/api.service";
import { useToast } from "@/contexts/ToastContext";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Storefront, Group } from "@mui/icons-material";

export const Settings = () => {
  const navigate = useNavigate();
  const [info, setInfo] = useState<RestaurantInfo | null>(null);
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [gstin, setGstin] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [footer, setFooter] = useState("");

  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await getRestaurantInfo();
      setInfo(data);
      setName(data.name || "");
      setLogo(data.logo || "");
      setGstin(data.gstin || "");
      setAddress(data.address || "");
      setPhone(data.phone || "");
      setEmail(data.email || "");
      setFooter(data.receipt_footer || "");
    } catch (error) {
      console.error(error);
      showToast("Failed to fetch settings configuration.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateRestaurantInfo({
        name,
        logo,
        gstin,
        address,
        phone,
        email,
        receipt_footer: footer,
      });
      showToast("Restaurant settings saved successfully.", "success");
      fetchSettings();
    } catch (error) {
      console.error(error);
      showToast("Failed to save settings.", "error");
    }
  };

  if (loading || !info) {
    return (
      <Box className="flex justify-center items-center h-64">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="p-6">
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h4" className="font-bold text-slate-800 flex items-center gap-2">
          <Storefront className="text-3xl" /> Restaurant Profile Settings
        </Typography>
        <Box className="flex gap-2">
          <Button variant="contained" color="primary" startIcon={<Storefront />}>
            Profile
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Group />}
            onClick={() => navigate("/users")}
          >
            User Directory
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card variant="outlined" className="shadow-sm">
            <CardContent className="p-6">
              <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Restaurant Name"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="GSTIN Tax Reference"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Contact Phone"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Contact Email"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Store Logo Image URL"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={logo}
                      onChange={(e) => setLogo(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Billing Address"
                      variant="outlined"
                      size="small"
                      multiline
                      rows={3}
                      fullWidth
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Receipt Footer Disclaimer"
                      variant="outlined"
                      size="small"
                      multiline
                      rows={2}
                      fullWidth
                      value={footer}
                      onChange={(e) => setFooter(e.target.value)}
                    />
                  </Grid>
                </Grid>

                <Box className="mt-4 flex justify-end">
                  <Button type="submit" variant="contained" color="primary">
                    Save Configuration
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
export default Settings;
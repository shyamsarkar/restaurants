import { useEffect, useState } from "react";
import { getKots, updateKotStatus, Kot } from "@/services/api.service";
import { useToast } from "@/contexts/ToastContext";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Box,
  CircularProgress,
} from "@mui/material";
import { AccessTime, Checklist } from "@mui/icons-material";

export const Kitchen = () => {
  const [kots, setKots] = useState<Kot[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchActiveKots = async () => {
    try {
      const data = await getKots();
      setKots(data);
    } catch (error) {
      console.error(error);
      showToast("Failed to fetch kitchen orders.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveKots();
    const interval = setInterval(fetchActiveKots, 8000); // auto refresh every 8s
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (id: number, currentStatus: string) => {
    let nextStatus = "preparing";
    if (currentStatus === "preparing") nextStatus = "ready";
    else if (currentStatus === "ready") nextStatus = "completed";

    try {
      await updateKotStatus(id, nextStatus);
      showToast(`KOT status updated to ${nextStatus}`, "success");
      fetchActiveKots();
    } catch (error) {
      console.error(error);
      showToast("Failed to update KOT status.", "error");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "error";
      case "preparing":
        return "warning";
      case "ready":
        return "success";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box className="flex justify-center items-center h-64">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="p-6">
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h4" className="font-bold text-slate-800">
          Kitchen Order Display (KDS)
        </Typography>
        <Button variant="outlined" color="primary" onClick={fetchActiveKots}>
          Refresh Board
        </Button>
      </Box>

      {kots.length === 0 ? (
        <Card className="text-center p-12 bg-slate-50 border-dashed border-2 border-slate-200">
          <Checklist className="text-6xl text-slate-300 mx-auto mb-3" />
          <Typography className="text-slate-500 font-medium">
            No active kitchen tickets. Everything cooked!
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {kots.map((kot) => (
            <Grid item xs={12} sm={6} md={4} key={kot.id}>
              <Card
                variant="outlined"
                className="shadow-sm hover:shadow-md transition-shadow duration-200 border-l-4"
                style={{
                  borderLeftColor:
                    kot.status === "pending"
                      ? "#ef4444"
                      : kot.status === "preparing"
                      ? "#f59e0b"
                      : "#10b981",
                }}
              >
                <CardContent className="p-4">
                  <Box className="flex justify-between items-center mb-3">
                    <Typography variant="subtitle1" className="font-bold text-slate-900">
                      KOT #{kot.id}
                    </Typography>
                    <Chip
                      size="small"
                      label={kot.status.toUpperCase()}
                      color={getStatusColor(kot.status)}
                    />
                  </Box>
                  <Typography variant="caption" className="text-slate-500 flex items-center mb-3">
                    <AccessTime className="w-3.5 h-3.5 mr-1" />
                    Sent at: {new Date(kot.created_at).toLocaleTimeString()}
                  </Typography>

                  <Box className="my-3 bg-slate-50 p-2 rounded max-h-48 overflow-y-auto">
                    {kot.kot_items.map((item) => (
                      <Box
                        key={item.id}
                        className="flex justify-between py-1.5 border-b border-slate-100 last:border-0"
                      >
                        <Typography variant="body2" className="text-slate-800">
                          {item.product?.name || `Product #${item.product_id}`}
                          {item.notes && (
                            <span className="block text-xs text-red-500 italic font-medium">
                              * {item.notes}
                            </span>
                          )}
                        </Typography>
                        <Typography
                          variant="body2"
                          className={`font-bold ${
                            item.quantity < 0 ? "text-red-500" : "text-slate-900"
                          }`}
                        >
                          {item.quantity < 0 ? item.quantity : `x ${item.quantity}`}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Box className="mt-4 flex justify-end">
                    <Button
                      variant="contained"
                      color={kot.status === "ready" ? "success" : "primary"}
                      onClick={() => handleUpdateStatus(kot.id, kot.status)}
                      size="small"
                      fullWidth
                    >
                      {kot.status === "pending" && "Start Preparing"}
                      {kot.status === "preparing" && "Mark Ready"}
                      {kot.status === "ready" && "Mark Completed"}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

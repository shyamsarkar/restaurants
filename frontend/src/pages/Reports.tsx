import { useEffect, useState } from "react";
import { getReports, ReportData } from "@/services/api.service";
import { useToast } from "@/contexts/ToastContext";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  CircularProgress,
  Divider,
} from "@mui/material";
import { AttachMoney, ShoppingBasket, Percent, RequestQuote } from "@mui/icons-material";

export const Reports = () => {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await getReports(startDate, endDate);
      setReportData(data);
    } catch (error) {
      console.error(error);
      showToast("Failed to fetch sales reports.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading || !reportData) {
    return (
      <Box className="flex justify-center items-center h-64">
        <CircularProgress />
      </Box>
    );
  }

  const { metrics, payment_modes, categories } = reportData;

  return (
    <Box className="p-6">
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h4" className="font-bold text-slate-800">
          Sales & Analytics Reports
        </Typography>
      </Box>

      {/* Date Range Selector */}
      <Paper variant="outlined" className="p-4 mb-6 shadow-sm flex items-center gap-4 flex-wrap">
        <TextField
          label="Start Date"
          type="date"
          InputLabelProps={{ shrink: true }}
          size="small"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <TextField
          label="End Date"
          type="date"
          InputLabelProps={{ shrink: true }}
          size="small"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <Button variant="contained" color="primary" onClick={fetchReports}>
          Generate Analytics
        </Button>
      </Paper>

      {/* Analytics Cards */}
      <Grid container spacing={3} className="mb-6">
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined" className="shadow-sm border-l-4 border-l-blue-500">
            <CardContent className="p-4 flex items-center justify-between">
              <Box>
                <Typography variant="caption" className="text-slate-500 block">
                  TOTAL REVENUE
                </Typography>
                <Typography variant="h5" className="font-bold text-slate-800">
                  ₹{metrics.total_revenue.toFixed(2)}
                </Typography>
              </Box>
              <AttachMoney className="text-blue-500 text-3xl" />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined" className="shadow-sm border-l-4 border-l-emerald-500">
            <CardContent className="p-4 flex items-center justify-between">
              <Box>
                <Typography variant="caption" className="text-slate-500 block">
                  ORDERS COMPLETED
                </Typography>
                <Typography variant="h5" className="font-bold text-slate-800">
                  {metrics.total_orders}
                </Typography>
              </Box>
              <ShoppingBasket className="text-emerald-500 text-3xl" />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined" className="shadow-sm border-l-4 border-l-amber-500">
            <CardContent className="p-4 flex items-center justify-between">
              <Box>
                <Typography variant="caption" className="text-slate-500 block">
                  TOTAL DISCOUNTS
                </Typography>
                <Typography variant="h5" className="font-bold text-slate-800">
                  -₹{metrics.total_discount.toFixed(2)}
                </Typography>
              </Box>
              <Percent className="text-amber-500 text-3xl" />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined" className="shadow-sm border-l-4 border-l-indigo-500">
            <CardContent className="p-4 flex items-center justify-between">
              <Box>
                <Typography variant="caption" className="text-slate-500 block">
                  TOTAL TAXES (GST)
                </Typography>
                <Typography variant="h5" className="font-bold text-slate-800">
                  ₹{metrics.total_tax.toFixed(2)}
                </Typography>
              </Box>
              <RequestQuote className="text-indigo-500 text-3xl" />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Breakdown Details */}
      <Grid container spacing={4}>
        {/* Payment Modes Split */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" className="font-bold text-slate-800 mb-3">
            Payment Method Split
          </Typography>
          <TableContainer component={Paper} variant="outlined" className="shadow-sm">
            <Table>
              <TableHead className="bg-slate-50">
                <TableRow>
                  <TableCell className="font-bold text-slate-700">Payment Mode</TableCell>
                  <TableCell className="font-bold text-slate-700" align="right">
                    Revenue Collected
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payment_modes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} align="center" className="text-slate-500 py-6">
                      No sales data in this date range.
                    </TableCell>
                  </TableRow>
                ) : (
                  payment_modes.map((modeData) => (
                    <TableRow key={modeData.mode} hover>
                      <TableCell className="font-medium text-slate-800">
                        {modeData.mode}
                      </TableCell>
                      <TableCell align="right" className="font-bold text-slate-800">
                        ₹{modeData.revenue.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Category Split */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" className="font-bold text-slate-800 mb-3">
            Sales by Category
          </Typography>
          <TableContainer component={Paper} variant="outlined" className="shadow-sm">
            <Table>
              <TableHead className="bg-slate-50">
                <TableRow>
                  <TableCell className="font-bold text-slate-700">Category</TableCell>
                  <TableCell className="font-bold text-slate-700" align="right">
                    Total Revenue
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} align="center" className="text-slate-500 py-6">
                      No categories matched sales data.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((catData) => (
                    <TableRow key={catData.category} hover>
                      <TableCell className="font-medium text-slate-800">
                        {catData.category}
                      </TableCell>
                      <TableCell align="right" className="font-bold text-slate-800">
                        ₹{catData.revenue.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};
export default Reports;
import { useEffect, useState } from "react";
import { getCustomers, createCustomer, Customer } from "@/services/api.service";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CardHeader,
  Avatar,
  Divider,
} from "@mui/material";
import { Add, Person, Search, Star } from "@mui/icons-material";

export const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchPhone, setSearchPhone] = useState("");
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const { showToast } = useToast();

  const fetchCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error(error);
      showToast("Failed to fetch customer list.", "error");
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async () => {
    if (!name || !phone) {
      showToast("Name and Phone are required.", "warning");
      return;
    }
    try {
      await createCustomer({ name, phone, email });
      showToast("Customer added successfully.", "success");
      setOpenAddDialog(false);
      setName("");
      setPhone("");
      setEmail("");
      fetchCustomers();
    } catch (error) {
      console.error(error);
      showToast("Failed to add customer. Phone might already be registered.", "error");
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.phone.includes(searchPhone) ||
      c.name.toLowerCase().includes(searchPhone.toLowerCase())
  );

  return (
    <Box className="p-6">
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h4" className="font-bold text-slate-800">
          Customer Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => setOpenAddDialog(true)}
        >
          Add Customer
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card variant="outlined" className="mb-6 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <Search className="text-slate-400" />
              <TextField
                variant="outlined"
                placeholder="Search by Name or Phone number..."
                size="small"
                fullWidth
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper} variant="outlined" className="shadow-sm">
            <Table>
              <TableHead className="bg-slate-50">
                <TableRow>
                  <TableCell className="font-bold text-slate-700">Customer</TableCell>
                  <TableCell className="font-bold text-slate-700">Phone</TableCell>
                  <TableCell className="font-bold text-slate-700">Email</TableCell>
                  <TableCell className="font-bold text-slate-700" align="right">
                    Loyalty Points
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" className="text-slate-500 py-8">
                      No customer accounts found matching search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} hover>
                      <TableCell>
                        <Box className="flex items-center gap-3">
                          <Avatar className="bg-blue-50 text-blue-600">
                            <Person />
                          </Avatar>
                          <Typography className="font-medium text-slate-800">
                            {customer.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.email || "-"}</TableCell>
                      <TableCell align="right">
                        <Box className="flex items-center justify-end gap-1 font-bold text-amber-600">
                          <Star className="text-amber-500 w-4 h-4" />
                          {customer.loyalty_points}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Add Customer Modal */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="font-bold text-slate-800">Register New Customer</DialogTitle>
        <DialogContent className="py-2">
          <Box className="flex flex-col gap-4 mt-2">
            <TextField
              label="Full Name"
              variant="outlined"
              size="small"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label="Phone Number"
              variant="outlined"
              size="small"
              fullWidth
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <TextField
              label="Email Address (Optional)"
              variant="outlined"
              size="small"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions className="p-4">
          <Button onClick={() => setOpenAddDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleAddCustomer} variant="contained" color="primary">
            Register Customer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

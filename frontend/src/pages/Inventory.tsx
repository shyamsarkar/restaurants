import { useEffect, useState } from "react";
import {
  getInventories,
  updateInventory,
  purchaseInventory,
  getPurchaseHistory,
  getProducts,
  Inventory,
  PurchaseHistory,
  Product,
} from "@/services/api.service";
import { useToast } from "@/contexts/ToastContext";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
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
  TextField,
  MenuItem,
  Tab,
  Tabs,
  Chip,
} from "@mui/material";
import { Add, WarningAmber, ShoppingBag, Edit } from "@mui/icons-material";

export const InventoryPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Dialog state
  const [openPurchaseDialog, setOpenPurchaseDialog] = useState(false);
  const [openAdjustDialog, setOpenAdjustDialog] = useState(false);

  // Form Fields
  const [selectedProductId, setSelectedProductId] = useState<number | "">("");
  const [qty, setQty] = useState(1);
  const [supplier, setSupplier] = useState("");
  const [unitPrice, setUnitPrice] = useState(0.0);

  const [adjustProductId, setAdjustProductId] = useState<number | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustLowThreshold, setAdjustLowThreshold] = useState(5);

  const { showToast } = useToast();

  const fetchInventoryData = async () => {
    try {
      const inv = await getInventories();
      setInventories(inv);
      const hist = await getPurchaseHistory();
      setPurchaseHistory(hist);
      const prods = await getProducts();
      setProducts(prods);
    } catch (error) {
      console.error(error);
      showToast("Failed to load inventory details.", "error");
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const handleCreatePurchase = async () => {
    if (!selectedProductId || qty <= 0 || !supplier || unitPrice <= 0) {
      showToast("Please fill all purchase details correctly.", "warning");
      return;
    }
    try {
      await purchaseInventory({
        product_id: Number(selectedProductId),
        quantity: qty,
        supplier,
        unit_price: unitPrice,
      });
      showToast("Purchase recorded and stock added.", "success");
      setOpenPurchaseDialog(false);
      setSelectedProductId("");
      setQty(1);
      setSupplier("");
      setUnitPrice(0);
      fetchInventoryData();
    } catch (error) {
      console.error(error);
      showToast("Failed to record purchase.", "error");
    }
  };

  const handleAdjustStock = async () => {
    if (!adjustProductId) return;
    try {
      await updateInventory(adjustProductId, adjustQty, adjustLowThreshold);
      showToast("Stock levels adjusted successfully.", "success");
      setOpenAdjustDialog(false);
      fetchInventoryData();
    } catch (error) {
      console.error(error);
      showToast("Failed to adjust stock level.", "error");
    }
  };

  return (
    <Box className="p-6">
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h4" className="font-bold text-slate-800">
          Inventory Control
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<ShoppingBag />}
          onClick={() => setOpenPurchaseDialog(true)}
        >
          New Purchase In
        </Button>
      </Box>

      <Box className="border-b border-slate-200 mb-6">
        <Tabs value={activeTab} onChange={(_, nv) => setActiveTab(nv)}>
          <Tab label="Stock Status" />
          <Tab label="Purchase History" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <TableContainer component={Paper} variant="outlined" className="shadow-sm">
          <Table>
            <TableHead className="bg-slate-50">
              <TableRow>
                <TableCell className="font-bold text-slate-700">Product</TableCell>
                <TableCell className="font-bold text-slate-700">Price</TableCell>
                <TableCell className="font-bold text-slate-700">GST Rate</TableCell>
                <TableCell className="font-bold text-slate-700" align="right">
                  In-Stock Qty
                </TableCell>
                <TableCell className="font-bold text-slate-700" align="right">
                  Low-Stock Trigger
                </TableCell>
                <TableCell className="font-bold text-slate-700" align="center">
                  Status
                </TableCell>
                <TableCell className="font-bold text-slate-700" align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" className="text-slate-500 py-8">
                    No items in inventory. Add products to populate.
                  </TableCell>
                </TableRow>
              ) : (
                inventories.map((inv) => {
                  const isLow = inv.stock_qty <= inv.low_stock_threshold;
                  return (
                    <TableRow key={inv.product_id} hover>
                      <TableCell className="font-medium text-slate-800">
                        {inv.product?.name || `Product #${inv.product_id}`}
                      </TableCell>
                      <TableCell>₹{Number(inv.product?.price || 0).toFixed(2)}</TableCell>
                      <TableCell>{inv.product?.gst_rate || 0}%</TableCell>
                      <TableCell align="right" className={`font-bold ${isLow ? "text-red-500" : "text-slate-800"}`}>
                        {inv.stock_qty}
                      </TableCell>
                      <TableCell align="right">{inv.low_stock_threshold}</TableCell>
                      <TableCell align="center">
                        {isLow ? (
                          <Chip
                            icon={<WarningAmber className="w-4 h-4" />}
                            size="small"
                            label="LOW STOCK"
                            color="error"
                            variant="outlined"
                          />
                        ) : (
                          <Chip size="small" label="GOOD STOCK" color="success" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          startIcon={<Edit />}
                          onClick={() => {
                            setAdjustProductId(inv.product_id);
                            setAdjustQty(inv.stock_qty);
                            setAdjustLowThreshold(inv.low_stock_threshold);
                            setOpenAdjustDialog(true);
                          }}
                        >
                          Adjust
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {activeTab === 1 && (
        <TableContainer component={Paper} variant="outlined" className="shadow-sm">
          <Table>
            <TableHead className="bg-slate-50">
              <TableRow>
                <TableCell className="font-bold text-slate-700">Date</TableCell>
                <TableCell className="font-bold text-slate-700">Product</TableCell>
                <TableCell className="font-bold text-slate-700">Supplier</TableCell>
                <TableCell className="font-bold text-slate-700" align="right">
                  Quantity
                </TableCell>
                <TableCell className="font-bold text-slate-700" align="right">
                  Unit Price
                </TableCell>
                <TableCell className="font-bold text-slate-700" align="right">
                  Total Paid
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchaseHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" className="text-slate-500 py-8">
                    No purchase history logs found.
                  </TableCell>
                </TableRow>
              ) : (
                purchaseHistory.map((hist) => (
                  <TableRow key={hist.id} hover>
                    <TableCell>{new Date(hist.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium text-slate-800">
                      {hist.product?.name || `Product #${hist.product_id}`}
                    </TableCell>
                    <TableCell>{hist.supplier}</TableCell>
                    <TableCell align="right">{hist.quantity}</TableCell>
                    <TableCell align="right">₹{Number(hist.unit_price).toFixed(2)}</TableCell>
                    <TableCell align="right" className="font-bold">
                      ₹{(hist.quantity * Number(hist.unit_price)).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Purchase Dialog */}
      <Dialog open={openPurchaseDialog} onClose={() => setOpenPurchaseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="font-bold text-slate-800">Record New Purchase</DialogTitle>
        <DialogContent className="py-2">
          <Box className="flex flex-col gap-4 mt-2">
            <TextField
              select
              label="Select Product"
              variant="outlined"
              size="small"
              fullWidth
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value as number)}
            >
              {products.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Quantity Purchased"
              type="number"
              variant="outlined"
              size="small"
              fullWidth
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
            <TextField
              label="Supplier"
              variant="outlined"
              size="small"
              fullWidth
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            />
            <TextField
              label="Unit Price (Paid)"
              type="number"
              variant="outlined"
              size="small"
              fullWidth
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
            />
          </Box>
        </DialogContent>
        <DialogActions className="p-4">
          <Button onClick={() => setOpenPurchaseDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleCreatePurchase} variant="contained" color="primary">
            Record Stock Purchase
          </Button>
        </DialogActions>
      </Dialog>

      {/* Adjust Dialog */}
      <Dialog open={openAdjustDialog} onClose={() => setOpenAdjustDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="font-bold text-slate-800">Adjust Stock Settings</DialogTitle>
        <DialogContent className="py-2">
          <Box className="flex flex-col gap-4 mt-2">
            <TextField
              label="Current Stock Count"
              type="number"
              variant="outlined"
              size="small"
              fullWidth
              value={adjustQty}
              onChange={(e) => setAdjustQty(Number(e.target.value))}
            />
            <TextField
              label="Low Stock Alert Threshold"
              type="number"
              variant="outlined"
              size="small"
              fullWidth
              value={adjustLowThreshold}
              onChange={(e) => setAdjustLowThreshold(Number(e.target.value))}
            />
          </Box>
        </DialogContent>
        <DialogActions className="p-4">
          <Button onClick={() => setOpenAdjustDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleAdjustStock} variant="contained" color="primary">
            Apply Adjustment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Divider,
  Typography,
  Grid,
  IconButton,
  Paper,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import {
  Add,
  Delete,
  Search,
  ShoppingCart,
  Fastfood,
  CheckCircle,
  Pause,
  PlayArrow,
  Cancel,
  PointOfSale,
  Close,
  PersonAdd,
} from "@mui/icons-material";
import {
  getDiningTables,
  getProducts,
  getCategories,
  getOrderItemsByDiningTable,
  addOrderItem,
  deleteOrderItem,
  updateOrderItem,
  cancelOrderItem,
  createOrder,
  updateOrder,
  getOrders,
  sendKot,
  holdOrder,
  resumeOrders,
  payOrder,
  cancelOrder,
  searchCustomerByPhone,
  createCustomer,
  DiningTable,
  Product,
  Category,
  OrderItem,
  Order,
  Customer,
} from "@/services/api.service";
import { useToast } from "@/contexts/ToastContext";
import { useAuthStore } from "@/stores/auth.store";

export const OrderPage = () => {
  const tenantId = useAuthStore((s) => s.tenantId) || "1";
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTable, setSelectedTable] = useState<DiningTable | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Takeaway states
  const [orderType, setOrderType] = useState<"dine_in" | "parcel">("dine_in");
  const [activeParcelOrders, setActiveParcelOrders] = useState<Order[]>([]);

  const loadActiveParcelOrders = async () => {
    try {
      const activeOrders = await getOrders({ status: "active", order_type: "parcel" });
      const draftOrders = await getOrders({ status: "draft", order_type: "parcel" });
      setActiveParcelOrders([...draftOrders, ...activeOrders]);
    } catch (error) {
      console.error(error);
      showToast("Failed to load active takeaway orders.", "error");
    }
  };

  const handleCreateTakeawayOrder = async () => {
    try {
      const newOrder = await createOrder({ order_type: "parcel", dining_table_id: null });
      setCurrentOrder(newOrder);
      showToast("Takeaway order created.", "success");
      loadActiveParcelOrders();
    } catch (error) {
      console.error(error);
      showToast("Failed to initialize takeaway order.", "error");
    }
  };

  // Customer Management
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [openCustDialog, setOpenCustDialog] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");

  // Hold / Resume
  const [openHoldDialog, setOpenHoldDialog] = useState(false);
  const [holdName, setHoldName] = useState("");
  const [openResumeDialog, setOpenResumeDialog] = useState(false);
  const [heldOrders, setHeldOrders] = useState<Order[]>([]);

  // Item Cancellation
  const [openCancelItemDialog, setOpenCancelItemDialog] = useState(false);
  const [cancelItemTarget, setCancelItemTarget] = useState<OrderItem | null>(null);
  const [cancelQty, setCancelQty] = useState(1);
  const [cancelReason, setCancelReason] = useState("");

  // Order Cancellation
  const [openCancelOrderDialog, setOpenCancelOrderDialog] = useState(false);
  const [orderCancelReason, setOrderCancelReason] = useState("");

  // Checkout / Payment
  const [openCheckoutDialog, setOpenCheckoutDialog] = useState(false);
  const [paymentMode, setPaymentMode] = useState<string>("cash");
  const [discountPct, setDiscountPct] = useState(0);
  const [serviceChargePct, setServiceChargePct] = useState(0);
  const [cashReceived, setCashReceived] = useState(0);
  const [paymentNotes, setPaymentNotes] = useState("");

  const { showToast } = useToast();

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const tbls = await getDiningTables();
      setTables(tbls);
      const prods = await getProducts();
      setProducts(prods);
      const cats = await getCategories();
      setCategories(cats);
      await loadActiveParcelOrders();
    } catch (error) {
      console.error(error);
      showToast("Error fetching POS startup data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSelectTable = async (table: DiningTable) => {
    setSelectedTable(table);
    setSelectedCustomer(null);
    setCustomerPhone("");
    
    if (table.current_order_id) {
      try {
        const orderData = await getOrder(table.current_order_id);
        setCurrentOrder(orderData);
        if (orderData.customer) {
          setSelectedCustomer(orderData.customer);
          setCustomerPhone(orderData.customer.phone);
        }
      } catch (error) {
        console.error(error);
        showToast("Failed to load active order for table.", "error");
      }
    } else {
      // create a draft order for this table
      try {
        const draftOrder = await createOrder({ dining_table_id: table.id });
        setCurrentOrder(draftOrder);
        const tbls = await getDiningTables();
        setTables(tbls);
      } catch (error) {
        console.error(error);
        showToast("Failed to initialize draft order.", "error");
      }
    }
  };

  const handleExitPOS = () => {
    setSelectedTable(null);
    setCurrentOrder(null);
    setSelectedCustomer(null);
    setCustomerPhone("");
    loadInitialData();
  };

  const handleAddProduct = async (product: Product) => {
    if (!currentOrder) {
      showToast("Please select or create an order first.", "warning");
      return;
    }

    try {
      await addOrderItem(null, product.id, product.price, 1, "", currentOrder.id);
      // Reload order items using the imported getOrder helper
      const updatedOrder = await getOrder(currentOrder.id);
      setCurrentOrder(updatedOrder);
      showToast(`${product.name} added to cart.`, "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to add product.", "error");
    }
  };

  const handleUpdateQty = async (item: OrderItem, currentQty: number, targetQty: number) => {
    if (item.kot_id) {
      // Sent item, must use negative cancel workflow
      setCancelItemTarget(item);
      setCancelQty(1);
      setCancelReason("");
      setOpenCancelItemDialog(true);
      return;
    }

    try {
      if (targetQty <= 0) {
        await deleteOrderItem(item.id);
        showToast("Item removed from cart.", "success");
      } else {
        await updateOrderItem(item.id, { quantity: targetQty });
      }
      const updatedOrder = await getOrder(currentOrder!.id);
      setCurrentOrder(updatedOrder);
    } catch (error) {
      console.error(error);
      showToast("Failed to update item quantity.", "error");
    }
  };

  const handleConfirmCancelItem = async () => {
    if (!cancelItemTarget) return;
    try {
      await cancelOrderItem(cancelItemTarget.id, cancelQty, cancelReason);
      showToast("Kitchen item cancellation processed.", "success");
      setOpenCancelItemDialog(false);
      const updatedOrder = await getOrder(currentOrder!.id);
      setCurrentOrder(updatedOrder);
    } catch (error) {
      console.error(error);
      showToast("Failed to cancel kitchen item.", "error");
    }
  };

  const handleSendKOT = async () => {
    if (!currentOrder) return;
    try {
      const activeOrder = await sendKot(currentOrder.id);
      setCurrentOrder(activeOrder);
      const tbls = await getDiningTables();
      setTables(tbls);
      showToast("KOT sent to kitchen successfully.", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to send KOT.", "error");
    }
  };

  const handleHoldOrder = async () => {
    if (!currentOrder || !holdName) return;
    try {
      await holdOrder(currentOrder.id, holdName);
      showToast("Order placed on hold.", "success");
      setOpenHoldDialog(false);
      setHoldName("");
      // Reset state
      setSelectedTable(null);
      setCurrentOrder(null);
      setSelectedCustomer(null);
      setCustomerPhone("");
      loadInitialData();
    } catch (error) {
      console.error(error);
      showToast("Failed to hold order.", "error");
    }
  };

  const handleShowResume = async () => {
    try {
      const held = await resumeOrders();
      setHeldOrders(held);
      setOpenResumeDialog(true);
    } catch (error) {
      console.error(error);
      showToast("Failed to fetch held orders.", "error");
    }
  };

  const handleResumeOrder = async (held: Order) => {
    setOpenResumeDialog(false);
    setSelectedCustomer(held.customer || null);
    setCustomerPhone(held.customer?.phone || "");
    
    if (held.dining_table_id) {
      const matchedTable = tables.find((t) => t.id === held.dining_table_id) || null;
      setSelectedTable(matchedTable);
    }
    
    try {
      const orderData = await getOrder(held.id);
      setCurrentOrder(orderData);
      showToast(`Resumed draft order for ${held.hold_name || "customer"}`, "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to resume held order.", "error");
    }
  };

  const handleCancelEntireOrder = async () => {
    if (!currentOrder) return;
    try {
      await cancelOrder(currentOrder.id, orderCancelReason);
      showToast("Order cancelled and table freed.", "success");
      setOpenCancelOrderDialog(false);
      setOrderCancelReason("");
      setSelectedTable(null);
      setCurrentOrder(null);
      setSelectedCustomer(null);
      setCustomerPhone("");
      loadInitialData();
    } catch (error) {
      console.error(error);
      showToast("Failed to cancel order.", "error");
    }
  };

  const handleCheckout = () => {
    if (!currentOrder || currentOrder.order_items.length === 0) {
      showToast("Cart is empty.", "warning");
      return;
    }
    setDiscountPct(currentOrder.discount || 0);
    setServiceChargePct(currentOrder.service_charge || 0);
    setCashReceived(currentOrder.total);
    setOpenCheckoutDialog(true);
  };

  const handleCompleteCheckout = async () => {
    if (!currentOrder) return;
    try {
      await payOrder(currentOrder.id, {
        payment_mode: paymentMode,
        discount: discountPct,
        service_charge: serviceChargePct,
        notes: paymentNotes,
      });
      showToast("Payment recorded. Receipt printed.", "success");
      setOpenCheckoutDialog(false);
      setPaymentNotes("");
      setSelectedTable(null);
      setCurrentOrder(null);
      setSelectedCustomer(null);
      setCustomerPhone("");
      loadInitialData();
    } catch (error) {
      console.error(error);
      showToast("Checkout failed. Try again.", "error");
    }
  };

  // Customer phone lookup
  const handleLookupCustomer = async () => {
    if (!customerPhone) return;
    try {
      const cust = await searchCustomerByPhone(customerPhone);
      setSelectedCustomer(cust);
      showToast(`Linked Customer: ${cust.name}`, "success");
      // Update order on backend
      if (currentOrder) {
        const updated = await updateOrder(currentOrder.id, { customer_id: cust.id });
        setCurrentOrder(updated);
      }
    } catch (error) {
      showToast("Customer not found. Create a new loyalty card.", "warning");
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustName || !customerPhone) {
      showToast("Name and Phone are required.", "warning");
      return;
    }
    try {
      const cust = await createCustomer({
        name: newCustName,
        phone: customerPhone,
        email: newCustEmail,
      });
      setSelectedCustomer(cust);
      showToast(`Customer registered & linked!`, "success");
      setOpenCustDialog(false);
      setNewCustName("");
      setNewCustEmail("");
      if (currentOrder) {
        const updated = await updateOrder(currentOrder.id, { customer_id: cust.id });
        setCurrentOrder(updated);
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to register customer.", "error");
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory ? p.category_id === selectedCategory : true;
    return matchesSearch && matchesCat;
  });

  return (
    <Box className="h-full flex flex-col p-4 bg-slate-100">
      {/* Top action buttons */}
      <Box className="flex justify-between items-center mb-4">
        <Typography variant="h5" className="font-bold text-slate-800">
          Billing POS Screen
        </Typography>
        <Box className="flex gap-2">
          <Button variant="outlined" color="primary" startIcon={<PlayArrow />} onClick={handleShowResume}>
            Resume Held
          </Button>
          {currentOrder && (
            <>
              <Button variant="outlined" color="secondary" onClick={handleExitPOS}>
                Back
              </Button>
              <Button variant="outlined" color="warning" startIcon={<Pause />} onClick={() => setOpenHoldDialog(true)}>
                Hold Bill
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Cancel />}
                onClick={() => setOpenCancelOrderDialog(true)}
              >
                Cancel Order
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Main Grid: Tables vs POS View */}
      {!currentOrder ? (
        <Box className="flex-1 flex flex-col">
          {/* Tabs for Order Type Selection */}
          <Box className="flex gap-2 mb-4 border-b border-slate-200 pb-2">
            <Button
              variant={orderType === "dine_in" ? "contained" : "outlined"}
              onClick={() => setOrderType("dine_in")}
            >
              Dine-In Tables
            </Button>
            <Button
              variant={orderType === "parcel" ? "contained" : "outlined"}
              onClick={() => {
                setOrderType("parcel");
                loadActiveParcelOrders();
              }}
            >
              Takeaway / Counter
            </Button>
          </Box>

          {orderType === "dine_in" ? (
            <>
              <Typography variant="h6" className="font-semibold text-slate-700 mb-3">
                Select a Table to start billing:
              </Typography>
              <Grid container spacing={3}>
                {tables.map((t) => (
                  <Grid item xs={6} sm={4} md={3} lg={2} key={t.id}>
                    <Card
                      variant="outlined"
                      onClick={() => handleSelectTable(t)}
                      className={`cursor-pointer transition-all duration-200 hover:scale-[1.03] ${
                        t.status === "occupied"
                          ? "bg-amber-50 border-amber-300"
                          : t.status === "billed"
                          ? "bg-emerald-50 border-emerald-300"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <CardContent className="text-center p-6">
                        <Typography variant="h6" className="font-bold text-slate-800">
                          {t.name}
                        </Typography>
                        <Chip
                          size="small"
                          label={t.status.toUpperCase()}
                          color={
                            t.status === "occupied" ? "warning" : t.status === "billed" ? "success" : "default"
                          }
                          className="mt-2"
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          ) : (
            <>
              <Box className="flex justify-between items-center mb-3">
                <Typography variant="h6" className="font-semibold text-slate-700">
                  Active Takeaway Orders:
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Add />}
                  onClick={handleCreateTakeawayOrder}
                >
                  New Takeaway Order
                </Button>
              </Box>
              
              {activeParcelOrders.length === 0 ? (
                <Paper variant="outlined" className="p-6 text-center text-slate-500">
                  No active takeaway orders. Click "New Takeaway Order" to start.
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {activeParcelOrders.map((ord) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={ord.id}>
                      <Card
                        variant="outlined"
                        onClick={() => setCurrentOrder(ord)}
                        className="cursor-pointer transition-all duration-200 hover:scale-[1.03] bg-white border-slate-200"
                      >
                        <CardContent className="p-4">
                          <Typography variant="h6" className="font-bold text-slate-800 mb-1">
                            Order #{ord.id}
                          </Typography>
                          <Typography variant="body2" className="text-slate-600 mb-1">
                            Customer: {ord.customer?.name || "Walk-in"}
                          </Typography>
                          <Typography variant="body2" className="text-slate-600 mb-2">
                            Items: {ord.order_items.reduce((sum, item) => sum + item.quantity, 0)}
                          </Typography>
                          <Box className="flex justify-between items-center mt-2">
                            <Chip
                              size="small"
                              label={ord.status.toUpperCase()}
                              color={ord.status === "active" ? "warning" : "default"}
                            />
                            <Typography className="font-bold text-emerald-600">
                              ₹{Number(ord.total).toFixed(2)}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}
        </Box>
      ) : (
        <Grid container spacing={3} className="flex-1 overflow-hidden h-full">
          {/* Left Panel: Category Tabs & Product Grid */}
          <Grid item xs={12} md={7} className="flex flex-col h-full overflow-hidden">
            <Paper variant="outlined" className="p-3 mb-3 flex gap-2 overflow-x-auto shadow-sm">
              <Chip
                label="All Categories"
                color={selectedCategory === null ? "primary" : "default"}
                onClick={() => setSelectedCategory(null)}
                className="cursor-pointer font-medium"
              />
              {categories.map((c) => (
                <Chip
                  key={c.id}
                  label={c.name}
                  color={selectedCategory === c.id ? "primary" : "default"}
                  onClick={() => setSelectedCategory(c.id)}
                  className="cursor-pointer font-medium"
                />
              ))}
            </Paper>

            <TextField
              variant="outlined"
              size="small"
              placeholder="Search dishes, drinks..."
              fullWidth
              className="bg-white mb-3"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <Box className="flex-1 overflow-y-auto pr-1">
              <Grid container spacing={2}>
                {filteredProducts.map((p) => {
                  const stock = p.inventory?.stock_qty ?? 0;
                  const isLow = stock <= (p.inventory?.low_stock_threshold ?? 5);
                  return (
                    <Grid item xs={6} sm={4} key={p.id}>
                      <Card
                        variant="outlined"
                        onClick={() => handleAddProduct(p)}
                        className={`cursor-pointer hover:border-blue-400 transition-all duration-200 ${
                          stock <= 0 ? "opacity-60 bg-slate-50" : "bg-white"
                        }`}
                      >
                        <CardContent className="p-3 relative">
                          <Typography variant="body1" className="font-bold text-slate-800 truncate">
                            {p.name}
                          </Typography>
                          <Typography variant="body2" className="text-slate-600 mt-1 font-semibold">
                            ₹{Number(p.price).toFixed(2)}
                          </Typography>
                          <Box className="mt-3 flex justify-between items-center">
                            <Chip size="small" label={`Stock: ${stock}`} color={isLow ? "error" : "success"} />
                            <Chip size="small" label={`${p.gst_rate}% GST`} variant="outlined" />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </Grid>

          {/* Right Panel: Cart & Calculations */}
          <Grid item xs={12} md={5} className="flex flex-col h-full overflow-hidden">
            <Paper variant="outlined" className="p-4 flex flex-col h-full bg-white shadow-md border-l-4 border-l-blue-600">
              <Box className="flex justify-between items-center mb-3">
                <Typography variant="h6" className="font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingCart /> {selectedTable ? `${selectedTable.name} Cart` : `Order #${currentOrder.id} Cart`}
                </Typography>
                <IconButton onClick={handleExitPOS}>
                  <Close />
                </IconButton>
              </Box>

              {/* Loyalty customer search */}
              <Box className="flex gap-2 mb-3">
                <TextField
                  placeholder="Customer Phone (Loyalty)"
                  size="small"
                  fullWidth
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
                <Button variant="outlined" size="small" onClick={handleLookupCustomer}>
                  Link
                </Button>
                <IconButton color="primary" onClick={() => setOpenCustDialog(true)}>
                  <PersonAdd />
                </IconButton>
              </Box>
              {selectedCustomer && (
                <Box className="mb-3 px-3 py-1.5 bg-amber-50 rounded border border-amber-200 flex justify-between items-center">
                  <Typography variant="caption" className="font-semibold text-amber-800">
                    Linked: {selectedCustomer.name}
                  </Typography>
                  <Typography variant="caption" className="font-bold text-amber-600">
                    Loyalty: {selectedCustomer.loyalty_points} pts
                  </Typography>
                </Box>
              )}

              <Divider className="mb-3" />

              {/* Cart Items list */}
              <Box className="flex-1 overflow-y-auto mb-3">
                {currentOrder && currentOrder.order_items.length === 0 ? (
                  <Typography className="text-center text-slate-400 mt-12 font-medium">
                    Cart is empty. Select items from the menu.
                  </Typography>
                ) : (
                  currentOrder?.order_items.map((item) => (
                    <Box key={item.id} className="py-2.5 border-b border-slate-100 flex items-center justify-between">
                      <Box className="flex-1 pr-2">
                        <Box className="flex items-center gap-2">
                          <Typography variant="body2" className="font-bold text-slate-800">
                            {item.name}
                          </Typography>
                          {item.kot_id && (
                            <Chip size="small" label="KITCHEN" color="success" className="h-4 text-[9px]" />
                          )}
                        </Box>
                        <Typography variant="caption" className="text-slate-500">
                          ₹{Number(item.price).toFixed(2)} | GST {item.gst_rate}%
                        </Typography>
                      </Box>
                      <Box className="flex items-center gap-1.5">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleUpdateQty(item, item.quantity, item.quantity - 1)}
                        >
                          <Delete className="w-4 h-4" />
                        </IconButton>
                        <Typography variant="body2" className="font-bold w-6 text-center text-slate-800">
                          {item.quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          color="primary"
                          disabled={!!item.kot_id} // Sent items are immutable
                          onClick={() => handleUpdateQty(item, item.quantity, item.quantity + 1)}
                        >
                          <Add className="w-4 h-4" />
                        </IconButton>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>

              {/* Subtotal, tax, discounts, total */}
              {currentOrder && (
                <Box className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
                  <Box className="flex justify-between py-1">
                    <Typography className="text-slate-600">Subtotal</Typography>
                    <Typography className="font-bold text-slate-800">
                      ₹{Number(currentOrder.subtotal).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box className="flex justify-between py-1 items-center">
                    <Typography className="text-slate-600">Discount (%)</Typography>
                    <TextField
                      type="number"
                      size="small"
                      style={{ width: 60 }}
                      inputProps={{ min: 0, max: 100 }}
                      value={discountPct}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setDiscountPct(val);
                        // Make PATCH update to order config
                        updateOrder(currentOrder.id, { discount: val })
                          .then((updated) => setCurrentOrder(updated));
                      }}
                    />
                  </Box>
                  <Box className="flex justify-between py-1 items-center">
                    <Typography className="text-slate-600">Service Charge (%)</Typography>
                    <TextField
                      type="number"
                      size="small"
                      style={{ width: 60 }}
                      inputProps={{ min: 0 }}
                      value={serviceChargePct}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setServiceChargePct(val);
                        updateOrder(currentOrder.id, { service_charge: val })
                          .then((updated) => setCurrentOrder(updated));
                      }}
                    />
                  </Box>
                  <Box className="flex justify-between py-1">
                    <Typography className="text-slate-600">GST (Taxes)</Typography>
                    <Typography className="font-bold text-slate-800">
                      ₹{Number(currentOrder.tax).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box className="flex justify-between py-1 text-slate-500 italic">
                    <Typography variant="caption">Round-off</Typography>
                    <Typography variant="caption">₹{Number(currentOrder.round_off).toFixed(2)}</Typography>
                  </Box>
                  <Divider className="my-2" />
                  <Box className="flex justify-between py-1 text-base font-bold text-slate-900">
                    <Typography>Final Total</Typography>
                    <Typography className="text-blue-600">₹{currentOrder.total}</Typography>
                  </Box>
                </Box>
              )}

              {/* POS Cart Actions */}
              <Box className="mt-4 flex gap-2">
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<Fastfood />}
                  onClick={handleSendKOT}
                  fullWidth
                >
                  Send KOT
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PointOfSale />}
                  onClick={handleCheckout}
                  fullWidth
                >
                  Checkout
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Hold Order Dialog */}
      <Dialog open={openHoldDialog} onClose={() => setOpenHoldDialog(false)}>
        <DialogTitle className="font-bold text-slate-800">Hold Active Order</DialogTitle>
        <DialogContent className="py-2">
          <TextField
            label="Hold Name / Label"
            variant="outlined"
            size="small"
            fullWidth
            className="mt-2"
            value={holdName}
            onChange={(e) => setHoldName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHoldDialog(false)}>Cancel</Button>
          <Button onClick={handleHoldOrder} color="warning" variant="contained">
            Hold Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resume Held Bills Dialog */}
      <Dialog open={openResumeDialog} onClose={() => setOpenResumeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="font-bold text-slate-800">Resume Held Bills</DialogTitle>
        <DialogContent className="py-2">
          <Box className="flex flex-col gap-2 mt-2">
            {heldOrders.length === 0 ? (
              <Typography className="text-slate-500 italic text-center p-6">
                No orders currently held on draft.
              </Typography>
            ) : (
              heldOrders.map((h) => (
                <Paper
                  key={h.id}
                  variant="outlined"
                  className="p-3 flex justify-between items-center hover:bg-slate-50 cursor-pointer"
                  onClick={() => handleResumeOrder(h)}
                >
                  <Box>
                    <Typography className="font-bold text-slate-800">
                      {h.hold_name || `Order #${h.id}`}
                    </Typography>
                    <Typography variant="caption" className="text-slate-500">
                      Table: {h.dining_table?.name || "None"} | Items: {h.order_items?.length || 0}
                    </Typography>
                  </Box>
                  <Typography className="font-bold text-blue-600">₹{h.total}</Typography>
                </Paper>
              ))
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResumeDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Sent Item Dialog */}
      <Dialog open={openCancelItemDialog} onClose={() => setOpenCancelItemDialog(false)}>
        <DialogTitle className="font-bold text-slate-800">Cancel Sent Kitchen Item</DialogTitle>
        <DialogContent className="py-2 flex flex-col gap-3">
          <Typography variant="body2" className="text-slate-600">
            Dishes already sent to the kitchen cannot be reduced directly. Specify the cancelled quantity and reason to update the kitchen ticket.
          </Typography>
          <TextField
            label="Quantity to Cancel"
            type="number"
            variant="outlined"
            size="small"
            fullWidth
            value={cancelQty}
            onChange={(e) => setCancelQty(Math.min(Number(e.target.value), cancelItemTarget?.quantity || 1))}
          />
          <TextField
            label="Reason for Cancellation"
            variant="outlined"
            size="small"
            fullWidth
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelItemDialog(false)}>Dismiss</Button>
          <Button onClick={handleConfirmCancelItem} color="error" variant="contained">
            Confirm Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog open={openCancelOrderDialog} onClose={() => setOpenCancelOrderDialog(false)}>
        <DialogTitle className="font-bold text-slate-800">Cancel Entire Order</DialogTitle>
        <DialogContent className="py-2">
          <Typography variant="body2" className="text-slate-600 mb-3">
            Are you sure you want to cancel the entire order? This will release the table and notify the kitchen of item voids.
          </Typography>
          <TextField
            label="Cancellation Reason"
            variant="outlined"
            size="small"
            fullWidth
            value={orderCancelReason}
            onChange={(e) => setOrderCancelReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelOrderDialog(false)}>Dismiss</Button>
          <Button onClick={handleCancelEntireOrder} color="error" variant="contained">
            Void Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={openCheckoutDialog} onClose={() => setOpenCheckoutDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle className="font-bold text-slate-800">Record Checkout Payment</DialogTitle>
        <DialogContent className="py-2">
          <Grid container spacing={3}>
            {/* Payment methods & entry */}
            <Grid item xs={12} md={6}>
              <Box className="flex flex-col gap-4 mt-2">
                <TextField
                  select
                  label="Payment Method"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="upi">UPI</MenuItem>
                  <MenuItem value="card">Card</MenuItem>
                  <MenuItem value="mixed">Mixed Split Mode</MenuItem>
                  <MenuItem value="nc">No Charge (NC)</MenuItem>
                </TextField>

                {paymentMode === "cash" && (
                  <>
                    <TextField
                      label="Amount Received"
                      type="number"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={cashReceived}
                      onChange={(e) => setCashReceived(Number(e.target.value))}
                    />
                    <Box className="p-3 bg-slate-50 rounded border border-slate-200">
                      <Typography variant="caption" className="text-slate-600 block">
                        Change Return Amount
                      </Typography>
                      <Typography variant="h6" className="font-bold text-slate-800">
                        ₹{Math.max(0, cashReceived - (currentOrder?.total || 0)).toFixed(2)}
                      </Typography>
                    </Box>
                  </>
                )}

                <TextField
                  label="Billing Notes"
                  variant="outlined"
                  size="small"
                  multiline
                  rows={3}
                  fullWidth
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
              </Box>
            </Grid>

            {/* Receipt Preview */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" className="p-4 bg-yellow-50/30 border-yellow-200 font-mono text-xs max-h-96 overflow-y-auto">
                <Typography className="text-center font-bold mb-1">*** RECEIPT PREVIEW ***</Typography>
                <Typography className="text-center mb-3">MealDesk Billing System</Typography>
                <Divider className="my-1 border-dashed" />
                <Typography>Order ID: #{currentOrder?.id}</Typography>
                <Typography>{selectedTable ? `Table: ${selectedTable.name}` : "Type: Takeaway"}</Typography>
                {selectedCustomer && <Typography>Customer: {selectedCustomer.name}</Typography>}
                <Divider className="my-2 border-dashed" />
                {currentOrder?.order_items.map((oi) => (
                  <Box key={oi.id} className="flex justify-between my-1">
                    <span>
                      {oi.name} x{oi.quantity}
                    </span>
                    <span>₹{(oi.quantity * oi.price).toFixed(2)}</span>
                  </Box>
                ))}
                <Divider className="my-2 border-dashed" />
                <Box className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{currentOrder?.subtotal}</span>
                </Box>
                <Box className="flex justify-between">
                  <span>Tax (GST)</span>
                  <span>₹{currentOrder?.tax}</span>
                </Box>
                {discountPct > 0 && (
                  <Box className="flex justify-between text-emerald-700">
                    <span>Discount ({discountPct}%)</span>
                    <span>-₹{((currentOrder?.subtotal || 0) * (discountPct / 100.0)).toFixed(2)}</span>
                  </Box>
                )}
                {serviceChargePct > 0 && (
                  <Box className="flex justify-between">
                    <span>Service Charge ({serviceChargePct}%)</span>
                    <span>+₹{((currentOrder?.subtotal || 0) * (serviceChargePct / 100.0)).toFixed(2)}</span>
                  </Box>
                )}
                <Box className="flex justify-between text-slate-500 italic">
                  <span>Round-off</span>
                  <span>₹{currentOrder?.round_off}</span>
                </Box>
                <Divider className="my-2 border-dashed" />
                <Box className="flex justify-between font-bold text-sm">
                  <span>GRAND TOTAL</span>
                  <span>₹{currentOrder?.total}</span>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions className="p-4">
          <Button onClick={() => setOpenCheckoutDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleCompleteCheckout} variant="contained" color="success">
            Complete Bill & Print
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Customer Dialog (nested) */}
      <Dialog open={openCustDialog} onClose={() => setOpenCustDialog(false)}>
        <DialogTitle className="font-bold text-slate-800">Register Loyalty customer</DialogTitle>
        <DialogContent className="py-2 flex flex-col gap-3">
          <TextField
            label="Phone number"
            variant="outlined"
            size="small"
            fullWidth
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
          <TextField
            label="Customer Name"
            variant="outlined"
            size="small"
            fullWidth
            value={newCustName}
            onChange={(e) => setNewCustName(e.target.value)}
          />
          <TextField
            label="Email Address"
            variant="outlined"
            size="small"
            fullWidth
            value={newCustEmail}
            onChange={(e) => setNewCustEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCustDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateCustomer} color="primary" variant="contained">
            Save Customer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

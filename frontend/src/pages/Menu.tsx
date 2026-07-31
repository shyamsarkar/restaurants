import { useEffect, useState } from "react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  Category,
  Product,
} from "@/services/api.service";
import { useToast } from "@/contexts/ToastContext";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  IconButton,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { Add, Delete, Edit, MenuBook, Fastfood } from "@mui/icons-material";

export const MenuEditor = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Category form state
  const [categoryName, setCategoryName] = useState("");
  const [categoryDesc, setCategoryDesc] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);

  // Product form state
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState(0.0);
  const [productGst, setProductGst] = useState(5.0);
  const [productCatId, setProductCatId] = useState<number | "">("");
  const [productAvailable, setProductAvailable] = useState(true);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  const { showToast } = useToast();

  const fetchMenuData = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
      const prods = await getProducts();
      setProducts(prods);
    } catch (error) {
      console.error(error);
      showToast("Failed to load menu details.", "error");
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    try {
      if (editingCategoryId !== null) {
        await updateCategory(editingCategoryId, { name: categoryName, description: categoryDesc });
        showToast("Category updated successfully.", "success");
      } else {
        await createCategory({ name: categoryName, description: categoryDesc });
        showToast("Category created successfully.", "success");
      }
      setCategoryName("");
      setCategoryDesc("");
      setEditingCategoryId(null);
      fetchMenuData();
    } catch (error) {
      console.error(error);
      showToast("Category operation failed.", "error");
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !productCatId) return;

    try {
      const payload = {
        name: productName,
        price: Number(productPrice),
        gst_rate: Number(productGst),
        category_id: Number(productCatId),
        is_available: productAvailable,
      };

      if (editingProductId !== null) {
        await updateProduct(editingProductId, payload);
        showToast("Product updated successfully.", "success");
      } else {
        await createProduct(payload);
        showToast("Product registered successfully.", "success");
      }
      resetProductForm();
      fetchMenuData();
    } catch (error) {
      console.error(error);
      showToast("Product operation failed.", "error");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await deleteCategory(id);
      showToast("Category deleted.", "success");
      fetchMenuData();
    } catch (error) {
      console.error(error);
      showToast("Failed to delete category.", "error");
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(id);
      showToast("Product deleted.", "success");
      fetchMenuData();
    } catch (error) {
      console.error(error);
      showToast("Failed to delete product.", "error");
    }
  };

  const resetProductForm = () => {
    setProductName("");
    setProductPrice(0);
    setProductGst(5.0);
    setProductCatId("");
    setProductAvailable(true);
    setEditingProductId(null);
  };

  return (
    <Box className="p-6">
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h4" className="font-bold text-slate-800">
          Menu & Catalogue Editor
        </Typography>
      </Box>

      <Box className="border-b border-slate-200 mb-6">
        <Tabs value={activeTab} onChange={(_, nv) => setActiveTab(nv)}>
          <Tab label="Categories" icon={<MenuBook />} iconPosition="start" />
          <Tab label="Products" icon={<Fastfood />} iconPosition="start" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Categories CRUD Form */}
          <Grid item xs={12} md={4}>
            <Card variant="outlined" className="shadow-sm">
              <CardContent className="p-5">
                <Typography variant="h6" className="font-bold text-slate-800 mb-4">
                  {editingCategoryId ? "Modify Category" : "Add Category"}
                </Typography>
                <form onSubmit={handleCategorySubmit} className="flex flex-col gap-4">
                  <TextField
                    label="Category Name"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                  />
                  <TextField
                    label="Description"
                    variant="outlined"
                    size="small"
                    multiline
                    rows={3}
                    fullWidth
                    value={categoryDesc}
                    onChange={(e) => setCategoryDesc(e.target.value)}
                  />
                  <Box className="flex gap-2">
                    <Button type="submit" variant="contained" color="primary" fullWidth>
                      {editingCategoryId ? "Update" : "Save"}
                    </Button>
                    {editingCategoryId && (
                      <Button
                        variant="outlined"
                        color="inherit"
                        onClick={() => {
                          setEditingCategoryId(null);
                          setCategoryName("");
                          setCategoryDesc("");
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </Box>
                </form>
              </CardContent>
            </Card>
          </Grid>

          {/* Categories List */}
          <Grid item xs={12} md={8}>
            <TableContainer component={Paper} variant="outlined" className="shadow-sm">
              <Table>
                <TableHead className="bg-slate-50">
                  <TableRow>
                    <TableCell className="font-bold text-slate-700">Category Name</TableCell>
                    <TableCell className="font-bold text-slate-700">Description</TableCell>
                    <TableCell className="font-bold text-slate-700" align="right">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" className="text-slate-500 py-8">
                        No categories found. Add one above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((cat) => (
                      <TableRow key={cat.id} hover>
                        <TableCell className="font-medium text-slate-800">{cat.name}</TableCell>
                        <TableCell>{cat.description || "-"}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingCategoryId(cat.id);
                              setCategoryName(cat.name);
                              setCategoryDesc(cat.description || "");
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteCategory(cat.id)}
                          >
                            <Delete className="w-4 h-4" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* Products CRUD Form */}
          <Grid item xs={12} md={4}>
            <Card variant="outlined" className="shadow-sm">
              <CardContent className="p-5">
                <Typography variant="h6" className="font-bold text-slate-800 mb-4">
                  {editingProductId ? "Modify Product" : "Add Product"}
                </Typography>
                <form onSubmit={handleProductSubmit} className="flex flex-col gap-4">
                  <TextField
                    label="Product Name"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                  <TextField
                    select
                    label="Select Category"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={productCatId}
                    onChange={(e) => setProductCatId(e.target.value as number)}
                  >
                    {categories.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Price"
                    type="number"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={productPrice}
                    onChange={(e) => setProductPrice(Number(e.target.value))}
                  />
                  <TextField
                    select
                    label="GST Rate (%)"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={productGst}
                    onChange={(e) => setProductGst(Number(e.target.value))}
                  >
                    <MenuItem value={0.0}>0%</MenuItem>
                    <MenuItem value={5.0}>5%</MenuItem>
                    <MenuItem value={12.0}>12%</MenuItem>
                    <MenuItem value={18.0}>18%</MenuItem>
                    <MenuItem value={28.0}>28%</MenuItem>
                  </TextField>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={productAvailable}
                        onChange={(e) => setProductAvailable(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Available for Billing"
                  />
                  <Box className="flex gap-2">
                    <Button type="submit" variant="contained" color="primary" fullWidth>
                      {editingProductId ? "Update" : "Save"}
                    </Button>
                    {editingProductId && (
                      <Button variant="outlined" color="inherit" onClick={resetProductForm}>
                        Cancel
                      </Button>
                    )}
                  </Box>
                </form>
              </CardContent>
            </Card>
          </Grid>

          {/* Products List */}
          <Grid item xs={12} md={8}>
            <TableContainer component={Paper} variant="outlined" className="shadow-sm">
              <Table>
                <TableHead className="bg-slate-50">
                  <TableRow>
                    <TableCell className="font-bold text-slate-700">Name</TableCell>
                    <TableCell className="font-bold text-slate-700">Category</TableCell>
                    <TableCell className="font-bold text-slate-700" align="right">
                      Price
                    </TableCell>
                    <TableCell className="font-bold text-slate-700" align="right">
                      GST
                    </TableCell>
                    <TableCell className="font-bold text-slate-700" align="center">
                      Available
                    </TableCell>
                    <TableCell className="font-bold text-slate-700" align="right">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" className="text-slate-500 py-8">
                        No products found. Register one above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((prod) => {
                      const matchedCat = categories.find((c) => c.id === prod.category_id);
                      return (
                        <TableRow key={prod.id} hover>
                          <TableCell className="font-medium text-slate-800">
                            {prod.name}
                          </TableCell>
                          <TableCell>{matchedCat ? matchedCat.name : "-"}</TableCell>
                          <TableCell align="right">₹{Number(prod.price).toFixed(2)}</TableCell>
                          <TableCell align="right">{prod.gst_rate}%</TableCell>
                          <TableCell align="center">
                            <Switch checked={prod.is_available} disabled size="small" />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingProductId(prod.id);
                                setProductName(prod.name);
                                setProductPrice(prod.price);
                                setProductGst(prod.gst_rate);
                                setProductCatId(prod.category_id);
                                setProductAvailable(prod.is_available);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteProduct(prod.id)}
                            >
                              <Delete className="w-4 h-4" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};
export default MenuEditor;

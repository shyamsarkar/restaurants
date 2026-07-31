import { useEffect, useState } from "react";
import {
  getDiningTables,
  createDiningTable,
  deleteDiningTable,
  updateDiningTable,
  transferTable,
  mergeTable,
  DiningTable,
} from "@/services/api.service";
import { useToast } from "@/contexts/ToastContext";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  IconButton,
  Chip,
} from "@mui/material";
import { Add, Delete, Edit, SwapHoriz, MergeType } from "@mui/icons-material";

export const Tables = () => {
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [tableName, setTableName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  // Transfer / Merge states
  const [openTransferDialog, setOpenTransferDialog] = useState(false);
  const [openMergeDialog, setOpenMergeDialog] = useState(false);
  const [sourceTable, setSourceTable] = useState<DiningTable | null>(null);
  const [targetTableId, setTargetTableId] = useState<number | "">("");

  const { showToast } = useToast();

  const fetchTables = async () => {
    try {
      const data = await getDiningTables();
      setTables(data);
    } catch (error) {
      console.error(error);
      showToast("Failed to fetch dining tables.", "error");
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleSubmitTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName.trim()) return;

    try {
      if (editingId !== null) {
        await updateDiningTable(editingId, { name: tableName });
        showToast("Table updated successfully.", "success");
      } else {
        await createDiningTable({ name: tableName });
        showToast("Table created successfully.", "success");
      }
      setTableName("");
      setEditingId(null);
      fetchTables();
    } catch (error) {
      console.error(error);
      showToast("Operation failed.", "error");
    }
  };

  const handleDeleteTable = async (id: number) => {
    if (!confirm("Are you sure you want to delete this table?")) return;
    try {
      await deleteDiningTable(id);
      showToast("Table deleted successfully.", "success");
      fetchTables();
    } catch (error) {
      console.error(error);
      showToast("Failed to delete table. Active orders might exist.", "error");
    }
  };

  const handleTransfer = async () => {
    if (!sourceTable || !targetTableId) return;
    try {
      await transferTable(sourceTable.id, Number(targetTableId));
      showToast(`Transferred active bill from ${sourceTable.name}`, "success");
      setOpenTransferDialog(false);
      setTargetTableId("");
      setSourceTable(null);
      fetchTables();
    } catch (error) {
      console.error(error);
      showToast("Failed to transfer table.", "error");
    }
  };

  const handleMerge = async () => {
    if (!sourceTable || !targetTableId) return;
    try {
      await mergeTable(sourceTable.id, Number(targetTableId));
      showToast(`Merged ${sourceTable.name} into target table`, "success");
      setOpenMergeDialog(false);
      setTargetTableId("");
      setSourceTable(null);
      fetchTables();
    } catch (error) {
      console.error(error);
      showToast("Failed to merge tables.", "error");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "occupied":
        return "warning";
      case "billed":
        return "success";
      default:
        return "default";
    }
  };

  // Find tables eligible for transfer (free tables)
  const freeTables = tables.filter((t) => t.status === "free" && !t.merged_into_id);

  // Find tables eligible for merge (active/free tables that aren't already merged)
  const targetMergeTables = tables.filter(
    (t) => t.id !== sourceTable?.id && !t.merged_into_id
  );

  return (
    <Box className="p-6">
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h4" className="font-bold text-slate-800">
          Tables Layout & Management
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Side: Create/Edit Table form */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined" className="shadow-sm">
            <CardContent className="p-5">
              <Typography variant="h6" className="font-bold text-slate-800 mb-4">
                {editingId ? "Modify Table" : "Register Table"}
              </Typography>
              <form onSubmit={handleSubmitTable} className="flex flex-col gap-4">
                <TextField
                  label="Table Name (e.g. Table 5)"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                />
                <Box className="flex gap-2">
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    fullWidth
                  >
                    {editingId ? "Update" : "Register"}
                  </Button>
                  {editingId && (
                    <Button
                      variant="outlined"
                      color="inherit"
                      onClick={() => {
                        setEditingId(null);
                        setTableName("");
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

        {/* Right Side: Interactive Tables Grid */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            {tables
              .filter((t) => !t.merged_into_id) // hide merged tables from layout
              .map((table) => (
                <Grid item xs={6} sm={4} key={table.id}>
                  <Card
                    variant="outlined"
                    className={`shadow-sm border-l-4 ${
                      table.status === "occupied"
                        ? "bg-amber-50/50 border-l-amber-500 border-amber-200"
                        : table.status === "billed"
                        ? "bg-emerald-50/50 border-l-emerald-500 border-emerald-200"
                        : "bg-white border-l-slate-400 border-slate-200"
                    }`}
                  >
                    <CardContent className="p-4">
                      <Box className="flex justify-between items-start mb-2">
                        <Typography variant="h6" className="font-bold text-slate-900">
                          {table.name}
                        </Typography>
                        <Chip
                          size="small"
                          label={table.status.toUpperCase()}
                          color={getStatusColor(table.status)}
                        />
                      </Box>

                      {/* Merged indicator */}
                      {table.merged_into_id && (
                        <Typography variant="caption" className="text-slate-500 italic block mb-2">
                          Merged into ID {table.merged_into_id}
                        </Typography>
                      )}

                      <Box className="flex gap-1.5 justify-end mt-4">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            setSourceTable(table);
                            setOpenTransferDialog(true);
                          }}
                          disabled={table.status === "free"}
                        >
                          <SwapHoriz />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => {
                            setSourceTable(table);
                            setOpenMergeDialog(true);
                          }}
                        >
                          <MergeType />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingId(table.id);
                            setTableName(table.name);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteTable(table.id)}
                        >
                          <Delete className="w-4 h-4" />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </Grid>
      </Grid>

      {/* Transfer Dialog */}
      <Dialog open={openTransferDialog} onClose={() => setOpenTransferDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="font-bold text-slate-800">Transfer Table</DialogTitle>
        <DialogContent className="py-2">
          {sourceTable && (
            <Box className="flex flex-col gap-4 mt-2">
              <Typography variant="body2" className="text-slate-600">
                Move active bill of <strong>{sourceTable.name}</strong> to an empty target table.
              </Typography>
              <TextField
                select
                label="Select Target Table"
                variant="outlined"
                size="small"
                fullWidth
                value={targetTableId}
                onChange={(e) => setTargetTableId(e.target.value as number)}
              >
                {freeTables.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTransferDialog(false)}>Cancel</Button>
          <Button onClick={handleTransfer} color="primary" variant="contained" disabled={!targetTableId}>
            Transfer Bill
          </Button>
        </DialogActions>
      </Dialog>

      {/* Merge Dialog */}
      <Dialog open={openMergeDialog} onClose={() => setOpenMergeDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="font-bold text-slate-800">Merge Tables</DialogTitle>
        <DialogContent className="py-2">
          {sourceTable && (
            <Box className="flex flex-col gap-4 mt-2">
              <Typography variant="body2" className="text-slate-600">
                Merge table <strong>{sourceTable.name}</strong> into another target table.
              </Typography>
              <TextField
                select
                label="Select Target Table"
                variant="outlined"
                size="small"
                fullWidth
                value={targetTableId}
                onChange={(e) => setTargetTableId(e.target.value as number)}
              >
                {targetMergeTables.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMergeDialog(false)}>Cancel</Button>
          <Button onClick={handleMerge} color="warning" variant="contained" disabled={!targetTableId}>
            Merge Table
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

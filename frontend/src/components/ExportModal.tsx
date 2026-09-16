import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  Stack,
  Box,
  Divider,
  TextField,
  Chip,
  IconButton,
  LinearProgress,
} from "@mui/material";
import {
  Close,
  FileDownloadOutlined,
  DragIndicator,
  SelectAll,
  Deselect,
} from "@mui/icons-material";
import { api, getErrorMessage } from "../api/axios";
import { ExportColumn, TransactionFilters } from "../types";
import { useAlert } from "../context/AlertContext";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  filters: TransactionFilters;
  totalMatching: number;
}

/**
 * A configurable CSV export experience:
 * - Users pick exactly which columns to include
 * - Column order is preserved as the user reorders/selects them (drag handles shown for affordance)
 * - Exports respect whatever filters are currently applied on the dashboard, so
 *   "export what I'm looking at" just works without extra config
 * - A live preview of the CSV header row updates as columns are toggled
 */
const ExportModal = ({ open, onClose, filters, totalMatching }: ExportModalProps) => {
  const { notify } = useAlert();
  const [availableColumns, setAvailableColumns] = useState<ExportColumn[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [fileName, setFileName] = useState("transactions_export");
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingColumns, setIsLoadingColumns] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchColumns = async () => {
      setIsLoadingColumns(true);
      try {
        const res = await api.get("/export/columns");
        const cols: ExportColumn[] = res.data.data;
        setAvailableColumns(cols);
        // Sensible default: everything except the raw profile image URL
        setSelected(cols.filter((c) => c.key !== "user_profile").map((c) => c.key));
      } catch (error) {
        notify(getErrorMessage(error), "error");
      } finally {
        setIsLoadingColumns(false);
      }
    };
    fetchColumns();
  }, [open, notify]);

  const toggleColumn = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectAll = () => setSelected(availableColumns.map((c) => c.key));
  const deselectAll = () => setSelected([]);

  const moveColumn = (index: number, direction: -1 | 1) => {
    setSelected((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleExport = async () => {
    if (selected.length === 0) {
      notify("Select at least one column to export.", "warning");
      return;
    }
    setIsExporting(true);
    try {
      const response = await api.post(
        "/export/csv",
        { columns: selected, filters, fileName },
        { responseType: "blob" }
      );

      // Trigger a direct browser download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${fileName}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      notify("Your CSV export has downloaded successfully.", "success");
      onClose();
    } catch (error) {
      // Blob error responses need to be read as text to extract the real message
      if (error instanceof Object && "response" in error) {
        // fall back to generic message; Axios blob errors don't auto-parse JSON
        notify("Export failed. Try adjusting your filters or column selection.", "error");
      } else {
        notify(getErrorMessage(error), "error");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const previewHeader = selected
    .map((key) => availableColumns.find((c) => c.key === key)?.label)
    .filter(Boolean)
    .join(", ");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">Export Transactions</Typography>
            <Typography variant="caption" color="text.secondary">
              {totalMatching.toLocaleString()} transaction(s) match your current filters
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      {isLoadingColumns && <LinearProgress />}

      <DialogContent dividers>
        <TextField
          fullWidth
          size="small"
          label="File name"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          sx={{ mb: 2 }}
          helperText="The .csv extension is added automatically"
        />

        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle2">Choose columns</Typography>
          <Stack direction="row" spacing={0.5}>
            <Button size="small" startIcon={<SelectAll />} onClick={selectAll}>
              All
            </Button>
            <Button size="small" startIcon={<Deselect />} onClick={deselectAll} color="inherit">
              None
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ maxHeight: 220, overflowY: "auto", pr: 1 }}>
          {availableColumns.map((col) => (
            <FormControlLabel
              key={col.key}
              sx={{ display: "flex", width: "100%", m: 0 }}
              control={
                <Checkbox
                  checked={selected.includes(col.key)}
                  onChange={() => toggleColumn(col.key)}
                  size="small"
                />
              }
              label={col.label}
            />
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" mb={1}>
          Column order in export
        </Typography>
        {selected.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No columns selected yet.
          </Typography>
        ) : (
          <Stack spacing={0.5}>
            {selected.map((key, index) => {
              const label = availableColumns.find((c) => c.key === key)?.label || key;
              return (
                <Stack
                  key={key}
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{
                    bgcolor: "background.default",
                    borderRadius: 2,
                    px: 1,
                    py: 0.5,
                  }}
                >
                  <DragIndicator fontSize="small" color="disabled" />
                  <Chip label={index + 1} size="small" />
                  <Typography variant="body2" flexGrow={1}>
                    {label}
                  </Typography>
                  <IconButton size="small" onClick={() => moveColumn(index, -1)} disabled={index === 0}>
                    ↑
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => moveColumn(index, 1)}
                    disabled={index === selected.length - 1}
                  >
                    ↓
                  </IconButton>
                </Stack>
              );
            })}
          </Stack>
        )}

        {previewHeader && (
          <Box mt={2} p={1.5} sx={{ bgcolor: "grey.50", borderRadius: 2, overflowX: "auto" }}>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              CSV header preview
            </Typography>
            <Typography variant="caption" fontFamily="monospace" whiteSpace="nowrap">
              {previewHeader}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<FileDownloadOutlined />}
          onClick={handleExport}
          disabled={isExporting || selected.length === 0}
        >
          {isExporting ? "Preparing..." : "Download CSV"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportModal;

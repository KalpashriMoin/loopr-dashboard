import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Chip,
  Avatar,
  Stack,
  Typography,
  Skeleton,
} from "@mui/material";
import { Transaction, Pagination, SortConfig } from "../types";

interface TransactionTableProps {
  transactions: Transaction[];
  pagination: Pagination;
  sortConfig: SortConfig;
  loading: boolean;
  onSortChange: (sortBy: SortConfig["sortBy"]) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  hidePagination?: boolean;
}

const columns: { key: SortConfig["sortBy"]; label: string; sortable: boolean }[] = [
  { key: "date", label: "Date", sortable: true },
  { key: "user_id", label: "User", sortable: true },
  { key: "category", label: "Category", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "amount", label: "Amount", sortable: true },
];

const currency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

const TransactionTable = ({
  transactions,
  pagination,
  sortConfig,
  loading,
  onSortChange,
  onPageChange,
  onLimitChange,
  hidePagination = false,
}: TransactionTableProps) => {
  return (
    <Paper variant="outlined">
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.key}>
                  {col.sortable ? (
                    <TableSortLabel
                      active={sortConfig.sortBy === col.key}
                      direction={sortConfig.sortBy === col.key ? sortConfig.sortOrder : "asc"}
                      onClick={() => onSortChange(col.key)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: pagination.limit }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((c) => (
                    <TableCell key={c.key}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">
                    No transactions match your current filters.
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              transactions.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar src={t.user_profile} sx={{ width: 26, height: 26 }} />
                      <Typography variant="body2">{t.user_id}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={t.category}
                      size="small"
                      color={t.category === "Revenue" ? "success" : "error"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={t.status}
                      size="small"
                      color={t.status === "Paid" ? "primary" : "warning"}
                      variant={t.status === "Paid" ? "filled" : "outlined"}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      fontWeight={600}
                      color={t.category === "Revenue" ? "success.main" : "error.main"}
                    >
                      {t.category === "Revenue" ? "+" : "-"}
                      {currency(t.amount)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      {!hidePagination && (
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page - 1}
          onPageChange={(_e, newPage) => onPageChange(newPage + 1)}
          rowsPerPage={pagination.limit}
          onRowsPerPageChange={(e) => onLimitChange(Number(e.target.value))}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      )}
    </Paper>
  );
};

export default TransactionTable;

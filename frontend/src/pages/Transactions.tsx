import { useCallback, useEffect, useState } from "react";
import { Box, Container, Typography, Button, Stack } from "@mui/material";
import { FileDownloadOutlined } from "@mui/icons-material";
import { api, getErrorMessage } from "../api/axios";
import { useAlert } from "../context/AlertContext";
import Navbar from "../components/Navbar";
import FilterBar, { emptyFilters } from "../components/FilterBar";
import TransactionTable from "../components/TransactionTable";
import ExportModal from "../components/ExportModal";
import { Transaction, Pagination, SortConfig, TransactionFilters } from "../types";

const buildQueryParams = (
  filters: TransactionFilters,
  sortConfig: SortConfig,
  page: number,
  limit: number
) => {
  const params: Record<string, string> = {
    page: String(page),
    limit: String(limit),
    sortBy: sortConfig.sortBy,
    sortOrder: sortConfig.sortOrder,
  };
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params[key] = value;
  });
  return params;
};

const Transactions = () => {
  const { notify } = useAlert();

  const [filters, setFilters] = useState<TransactionFilters>(emptyFilters);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ sortBy: "date", sortOrder: "desc" });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [tableLoading, setTableLoading] = useState(true);

  const [filterOptions, setFilterOptions] = useState<{
    categories: string[];
    statuses: string[];
    users: string[];
  }>({ categories: [], statuses: [], users: [] });

  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    api
      .get("/transactions/filters")
      .then((res) => setFilterOptions(res.data.data))
      .catch((error) => notify(getErrorMessage(error), "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTransactions = useCallback(async () => {
    setTableLoading(true);
    try {
      const params = buildQueryParams(filters, sortConfig, page, limit);
      const res = await api.get("/transactions", { params });
      setTransactions(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) {
      notify(getErrorMessage(error), "error");
    } finally {
      setTableLoading(false);
    }
  }, [filters, sortConfig, page, limit, notify]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleFilterChange = (newFilters: TransactionFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleSortChange = (sortBy: SortConfig["sortBy"]) => {
    setSortConfig((prev) => ({
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Navbar />

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">All Transactions</Typography>
          <Button
            variant="contained"
            startIcon={<FileDownloadOutlined />}
            onClick={() => setExportOpen(true)}
          >
            Export CSV
          </Button>
        </Stack>

        <FilterBar
          filters={filters}
          onChange={handleFilterChange}
          categories={filterOptions.categories}
          statuses={filterOptions.statuses}
          users={filterOptions.users}
        />

        <TransactionTable
          transactions={transactions}
          pagination={pagination}
          sortConfig={sortConfig}
          loading={tableLoading}
          onSortChange={handleSortChange}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </Container>

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        filters={filters}
        totalMatching={pagination.total}
      />
    </Box>
  );
};

export default Transactions;
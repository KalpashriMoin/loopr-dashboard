// import { useCallback, useEffect, useState } from "react";
// import {
//   AppBar,
//   Toolbar,
//   Typography,
//   Box,
//   Container,
//   Button,
//   Avatar,
//   Stack,
//   IconButton,
//   Menu,
//   MenuItem,
//   Divider,
// } from "@mui/material";
// import { FileDownloadOutlined, InsightsRounded, Logout, KeyboardArrowDown } from "@mui/icons-material";
// import { api, getErrorMessage } from "../api/axios";
// import { useAuth } from "../context/AuthContext";
// import { useAlert } from "../context/AlertContext";
// import ChartsSection from "../components/ChartsSection";
// import FilterBar, { emptyFilters } from "../components/FilterBar";
// import TransactionTable from "../components/TransactionTable";
// import ExportModal from "../components/ExportModal";
// import {
//   Transaction,
//   Pagination,
//   SortConfig,
//   SummaryData,
//   TransactionFilters,
// } from "../types";

// const buildQueryParams = (
//   filters: TransactionFilters,
//   sortConfig: SortConfig,
//   page: number,
//   limit: number
// ) => {
//   const params: Record<string, string> = {
//     page: String(page),
//     limit: String(limit),
//     sortBy: sortConfig.sortBy,
//     sortOrder: sortConfig.sortOrder,
//   };
//   Object.entries(filters).forEach(([key, value]) => {
//     if (value) params[key] = value;
//   });
//   return params;
// };

// const Dashboard = () => {
//   const { user, logout } = useAuth();
//   const { notify } = useAlert();

//   const [filters, setFilters] = useState<TransactionFilters>(emptyFilters);
//   const [sortConfig, setSortConfig] = useState<SortConfig>({ sortBy: "date", sortOrder: "desc" });
//   const [page, setPage] = useState(1);
//   const [limit, setLimit] = useState(10);

//   const [transactions, setTransactions] = useState<Transaction[]>([]);
//   const [pagination, setPagination] = useState<Pagination>({
//     page: 1,
//     limit: 10,
//     total: 0,
//     totalPages: 1,
//   });
//   const [tableLoading, setTableLoading] = useState(true);

//   const [summary, setSummary] = useState<SummaryData | null>(null);
//   const [summaryLoading, setSummaryLoading] = useState(true);

//   const [filterOptions, setFilterOptions] = useState<{
//     categories: string[];
//     statuses: string[];
//     users: string[];
//   }>({ categories: [], statuses: [], users: [] });

//   const [exportOpen, setExportOpen] = useState(false);
//   const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

//   // Fetch filter dropdown options once on mount
//   useEffect(() => {
//     api
//       .get("/transactions/filters")
//       .then((res) => setFilterOptions(res.data.data))
//       .catch((error) => notify(getErrorMessage(error), "error"));
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // Fetch paginated/filtered/sorted transactions whenever relevant state changes
//   const fetchTransactions = useCallback(async () => {
//     setTableLoading(true);
//     try {
//       const params = buildQueryParams(filters, sortConfig, page, limit);
//       const res = await api.get("/transactions", { params });
//       setTransactions(res.data.data);
//       setPagination(res.data.pagination);
//     } catch (error) {
//       notify(getErrorMessage(error), "error");
//     } finally {
//       setTableLoading(false);
//     }
//   }, [filters, sortConfig, page, limit, notify]);

//   // Fetch dashboard summary (KPIs + charts), respecting the same filters
//   const fetchSummary = useCallback(async () => {
//     setSummaryLoading(true);
//     try {
//       const params = buildQueryParams(filters, sortConfig, 1, 1);
//       delete params.page;
//       delete params.limit;
//       delete params.sortBy;
//       delete params.sortOrder;
//       const res = await api.get("/transactions/summary", { params });
//       setSummary(res.data.data);
//     } catch (error) {
//       notify(getErrorMessage(error), "error");
//     } finally {
//       setSummaryLoading(false);
//     }
//   }, [filters, sortConfig, notify]);

//   useEffect(() => {
//     fetchTransactions();
//   }, [fetchTransactions]);

//   useEffect(() => {
//     fetchSummary();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [filters]);

//   const handleFilterChange = (newFilters: TransactionFilters) => {
//     setFilters(newFilters);
//     setPage(1); // reset to first page whenever filters change
//   };

//   const handleSortChange = (sortBy: SortConfig["sortBy"]) => {
//     setSortConfig((prev) => ({
//       sortBy,
//       sortOrder: prev.sortBy === sortBy && prev.sortOrder === "asc" ? "desc" : "asc",
//     }));
//   };

//   return (
//     <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
//       <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: "1px solid #EAEAF0" }}>
//         <Toolbar>
//           <InsightsRounded color="primary" sx={{ mr: 1 }} />
//           <Typography variant="h6" flexGrow={1}>
//             Loopr Dashboard
//           </Typography>
//           <Button
//             variant="contained"
//             startIcon={<FileDownloadOutlined />}
//             onClick={() => setExportOpen(true)}
//             sx={{ mr: 2 }}
//           >
//             Export CSV
//           </Button>
//           <Stack
//             direction="row"
//             spacing={1}
//             alignItems="center"
//             sx={{ cursor: "pointer" }}
//             onClick={(e) => setMenuAnchor(e.currentTarget)}
//           >
//             <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
//               {user?.name?.[0]?.toUpperCase() || "U"}
//             </Avatar>
//             <Typography variant="body2">{user?.name}</Typography>
//             <IconButton size="small">
//               <KeyboardArrowDown fontSize="small" />
//             </IconButton>
//           </Stack>
//           <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
//             <MenuItem disabled>{user?.email}</MenuItem>
//             <Divider />
//             <MenuItem onClick={logout}>
//               <Logout fontSize="small" sx={{ mr: 1 }} /> Logout
//             </MenuItem>
//           </Menu>
//         </Toolbar>
//       </AppBar>

//       <Container maxWidth="xl" sx={{ py: 3 }}>
//         <ChartsSection summary={summary} loading={summaryLoading} />

//         <FilterBar
//           filters={filters}
//           onChange={handleFilterChange}
//           categories={filterOptions.categories}
//           statuses={filterOptions.statuses}
//           users={filterOptions.users}
//         />

//         <TransactionTable
//           transactions={transactions}
//           pagination={pagination}
//           sortConfig={sortConfig}
//           loading={tableLoading}
//           onSortChange={handleSortChange}
//           onPageChange={setPage}
//           onLimitChange={(newLimit) => {
//             setLimit(newLimit);
//             setPage(1);
//           }}
//         />
//       </Container>

//       <ExportModal
//         open={exportOpen}
//         onClose={() => setExportOpen(false)}
//         filters={filters}
//         totalMatching={pagination.total}
//       />
//     </Box>
//   );
// };

// export default Dashboard;





import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, Paper, Typography, Stack, Button } from "@mui/material";
import { ArrowForward } from "@mui/icons-material";
import { api, getErrorMessage } from "../api/axios";
import { useAlert } from "../context/AlertContext";
import Navbar from "../components/Navbar";
import ChartsSection from "../components/ChartsSection";
import TransactionTable from "../components/TransactionTable";
import { Transaction, Pagination, SortConfig, SummaryData } from "../types";

const RECENT_TRANSACTIONS_LIMIT = 8;

const Dashboard = () => {
  const { notify } = useAlert();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setSummaryLoading(true);
      try {
        const res = await api.get("/transactions/summary");
        setSummary(res.data.data);
      } catch (error) {
        notify(getErrorMessage(error), "error");
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchRecent = async () => {
      setRecentLoading(true);
      try {
        const res = await api.get("/transactions", {
          params: {
            page: 1,
            limit: RECENT_TRANSACTIONS_LIMIT,
            sortBy: "date",
            sortOrder: "desc",
          },
        });
        setRecentTransactions(res.data.data);
      } catch (error) {
        notify(getErrorMessage(error), "error");
      } finally {
        setRecentLoading(false);
      }
    };
    fetchRecent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const previewSortConfig: SortConfig = { sortBy: "date", sortOrder: "desc" };
  const previewPagination: Pagination = {
    page: 1,
    limit: RECENT_TRANSACTIONS_LIMIT,
    total: recentTransactions.length,
    totalPages: 1,
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Navbar />

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <ChartsSection summary={summary} loading={summaryLoading} />

        <Paper variant="outlined" sx={{ mt: 1 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ px: 2, pt: 2 }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              Recent Transactions
            </Typography>
            <Button
              size="small"
              endIcon={<ArrowForward />}
              onClick={() => navigate("/transactions")}
            >
              View all transactions
            </Button>
          </Stack>
          <Box sx={{ p: 2, pt: 1 }}>
            <TransactionTable
              transactions={recentTransactions}
              pagination={previewPagination}
              sortConfig={previewSortConfig}
              loading={recentLoading}
              onSortChange={() => {}}
              onPageChange={() => {}}
              onLimitChange={() => {}}
              hidePagination
            />
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Dashboard;
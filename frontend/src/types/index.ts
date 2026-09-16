export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "analyst";
}

export interface Transaction {
  id: number;
  date: string;
  amount: number;
  category: "Revenue" | "Expense";
  status: "Paid" | "Pending";
  user_id: string;
  user_profile: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TransactionFilters {
  search: string;
  category: string;
  status: string;
  user_id: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
}

export interface SortConfig {
  sortBy: "date" | "amount" | "category" | "status" | "user_id";
  sortOrder: "asc" | "desc";
}

export interface KPIs {
  totalRevenue: number;
  totalExpense: number;
  netBalance: number;
  totalTransactions: number;
  pendingCount: number;
}

export interface MonthlyTrendPoint {
  month: string;
  Revenue: number;
  Expense: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
}

export interface StatusBreakdown {
  status: string;
  total: number;
  count: number;
}

export interface SummaryData {
  kpis: KPIs;
  monthlyTrend: MonthlyTrendPoint[];
  categoryBreakdown: CategoryBreakdown[];
  statusBreakdown: StatusBreakdown[];
}

export interface ExportColumn {
  key: string;
  label: string;
}

export interface AlertMessage {
  id: string;
  severity: "error" | "warning" | "success" | "info";
  message: string;
}

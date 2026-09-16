import { Grid, Paper, Typography, Box, Stack, Skeleton } from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  AccountBalanceWallet,
  ReceiptLong,
  HourglassBottom,
} from "@mui/icons-material";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { SummaryData } from "../types";

interface ChartsSectionProps {
  summary: SummaryData | null;
  loading: boolean;
}

const currency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

const KPI_CONFIG = [
  { key: "totalRevenue", label: "Total Revenue", icon: TrendingUp, color: "#10B981", isCount: false },
  { key: "totalExpense", label: "Total Expense", icon: TrendingDown, color: "#EF4444", isCount: false },
  { key: "netBalance", label: "Net Balance", icon: AccountBalanceWallet, color: "#4F46E5", isCount: false },
  { key: "totalTransactions", label: "Transactions", icon: ReceiptLong, color: "#F59E0B", isCount: true },
  { key: "pendingCount", label: "Pending", icon: HourglassBottom, color: "#8B5CF6", isCount: true },
] as const;

const PIE_COLORS: Record<string, string> = {
  Revenue: "#10B981",
  Expense: "#EF4444",
};

const ChartsSection = ({ summary, loading }: ChartsSectionProps) => {
  if (loading || !summary) {
    return (
      <Grid container spacing={2} mb={2}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Grid item xs={12} sm={6} md={2.4} key={i}>
            <Skeleton variant="rounded" height={100} />
          </Grid>
        ))}
        <Grid item xs={12} md={8}>
          <Skeleton variant="rounded" height={320} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Skeleton variant="rounded" height={320} />
        </Grid>
      </Grid>
    );
  }

  const { kpis, monthlyTrend, categoryBreakdown } = summary;

  return (
    <Box mb={2}>
      {/* KPI cards */}
      <Grid container spacing={2} mb={2}>
        {KPI_CONFIG.map(({ key, label, icon: Icon, color, isCount }) => (
          <Grid item xs={12} sm={6} md={2.4} key={key}>
            <Paper sx={{ p: 2, height: "100%" }} variant="outlined">
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: `${color}1A`,
                    color,
                  }}
                >
                  <Icon fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography variant="h6" lineHeight={1.2}>
                    {isCount ? kpis[key] : currency(kpis[key])}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Trend + breakdown charts */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 360 }} variant="outlined">
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              Revenue vs Expense Trend
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F5" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip formatter={(value: number) => currency(value)} />
                <Legend />
                <Line type="monotone" dataKey="Revenue" stroke="#10B981" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Expense" stroke="#EF4444" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 360 }} variant="outlined">
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              Category Breakdown
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="total"
                  nameKey="category"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                >
                  {categoryBreakdown.map((entry) => (
                    <Cell key={entry.category} fill={PIE_COLORS[entry.category] || "#4F46E5"} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => currency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ChartsSection;

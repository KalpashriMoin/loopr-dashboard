import { Response } from "express";
import asyncHandler from "express-async-handler";
import { Transaction } from "../models/Transaction";
import { AuthRequest } from "../middleware/auth";
import { FilterQuery } from "mongoose";
import { ITransaction } from "../models/Transaction";

/**
 * Builds a Mongo filter object from validated query params.
 * Supports: search, category, status, user_id, dateFrom, dateTo, amountMin, amountMax
 */
const buildFilter = (query: AuthRequest["query"]): FilterQuery<ITransaction> => {
  const filter: FilterQuery<ITransaction> = {};

  if (query.search && typeof query.search === "string") {
    const regex = new RegExp(query.search.trim(), "i");
    filter.$or = [{ user_id: regex }, { category: regex }, { status: regex }];
  }

  if (query.category && query.category !== "All") {
    filter.category = query.category as string;
  }

  if (query.status && query.status !== "All") {
    filter.status = query.status as string;
  }

  if (query.user_id && query.user_id !== "All") {
    filter.user_id = query.user_id as string;
  }

  if (query.dateFrom || query.dateTo) {
    filter.date = {};
    if (query.dateFrom) filter.date.$gte = new Date(query.dateFrom as string);
    if (query.dateTo) filter.date.$lte = new Date(query.dateTo as string);
  }

  if (query.amountMin || query.amountMax) {
    filter.amount = {};
    if (query.amountMin) filter.amount.$gte = Number(query.amountMin);
    if (query.amountMax) filter.amount.$lte = Number(query.amountMax);
  }

  return filter;
};

// @route  GET /api/transactions
// @access Private
// Query params: page, limit, sortBy, sortOrder, search, category, status, user_id,
//               dateFrom, dateTo, amountMin, amountMax
export const getTransactions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
  const sortBy = (req.query.sortBy as string) || "date";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

  const allowedSortFields = ["date", "amount", "category", "status", "user_id"];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "date";

  const filter = buildFilter(req.query);

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

// @route  GET /api/transactions/filters
// @access Private
// Returns distinct values to populate filter dropdowns on the frontend
export const getFilterOptions = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [categories, statuses, users] = await Promise.all([
    Transaction.distinct("category"),
    Transaction.distinct("status"),
    Transaction.distinct("user_id"),
  ]);

  res.status(200).json({
    success: true,
    data: { categories, statuses, users: users.sort() },
  });
});

// @route  GET /api/transactions/summary
// @access Private
// Powers the dashboard charts: monthly revenue vs expense trend, category breakdown, KPIs
export const getSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const filter = buildFilter(req.query);

  const [totals, monthlyTrend, categoryBreakdown, statusBreakdown] = await Promise.all([
    // Overall KPIs
    Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $cond: [{ $eq: ["$category", "Revenue"] }, "$amount", 0] },
          },
          totalExpense: {
            $sum: { $cond: [{ $eq: ["$category", "Expense"] }, "$amount", 0] },
          },
          totalTransactions: { $sum: 1 },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
          },
        },
      },
    ]),
    // Revenue vs Expense trend by month
    Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            category: "$category",
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    // Category breakdown (for pie chart)
    Transaction.aggregate([
      { $match: filter },
      { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    // Status breakdown
    Transaction.aggregate([
      { $match: filter },
      { $group: { _id: "$status", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
  ]);

  const kpis = totals[0] || {
    totalRevenue: 0,
    totalExpense: 0,
    totalTransactions: 0,
    pendingCount: 0,
  };

  // Reshape monthly trend into { month: 'YYYY-MM', Revenue, Expense }
  const trendMap = new Map<string, { month: string; Revenue: number; Expense: number }>();
  for (const row of monthlyTrend) {
    const key = `${row._id.year}-${String(row._id.month).padStart(2, "0")}`;
    if (!trendMap.has(key)) {
      trendMap.set(key, { month: key, Revenue: 0, Expense: 0 });
    }
    const entry = trendMap.get(key)!;
    entry[row._id.category as "Revenue" | "Expense"] = row.total;
  }

  res.status(200).json({
    success: true,
    data: {
      kpis: {
        totalRevenue: kpis.totalRevenue,
        totalExpense: kpis.totalExpense,
        netBalance: kpis.totalRevenue - kpis.totalExpense,
        totalTransactions: kpis.totalTransactions,
        pendingCount: kpis.pendingCount,
      },
      monthlyTrend: Array.from(trendMap.values()),
      categoryBreakdown: categoryBreakdown.map((c) => ({
        category: c._id,
        total: c.total,
        count: c.count,
      })),
      statusBreakdown: statusBreakdown.map((s) => ({
        status: s._id,
        total: s.total,
        count: s.count,
      })),
    },
  });
});

import { Response } from "express";
import asyncHandler from "express-async-handler";
import { toCSV } from "../utils/csv";
import { Transaction, ITransaction } from "../models/Transaction";
import { AuthRequest } from "../middleware/auth";
import { ApiError } from "../middleware/errorHandler";
import { FilterQuery } from "mongoose";

// Master list of exportable columns and their human-readable labels.
// Keeping this centralized means the frontend and backend always agree
// on what "columns" means, and validation is a simple whitelist check.
export const EXPORTABLE_COLUMNS: Record<string, string> = {
  id: "Transaction ID",
  date: "Date",
  amount: "Amount",
  category: "Category",
  status: "Status",
  user_id: "User ID",
  user_profile: "User Profile",
};

// @route  GET /api/export/columns
// @access Private
// Lets the frontend render the export configuration modal dynamically
// instead of hardcoding the column list on both ends.
export const getExportColumns = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.status(200).json({
    success: true,
    data: Object.entries(EXPORTABLE_COLUMNS).map(([key, label]) => ({ key, label })),
  });
});

interface ExportRequestBody {
  columns: string[];
  filters?: {
    search?: string;
    category?: string;
    status?: string;
    user_id?: string;
    dateFrom?: string;
    dateTo?: string;
    amountMin?: number;
    amountMax?: number;
  };
  fileName?: string;
}

// @route  POST /api/export/csv
// @access Private
// Accepts the same filter shape used by the transactions list, so a user
// can configure columns and export exactly the filtered view they're looking at.
export const exportCSV = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { columns, filters = {}, fileName } = req.body as ExportRequestBody;

  if (!Array.isArray(columns) || columns.length === 0) {
    throw new ApiError(400, "Select at least one column to export.");
  }

  const invalidColumns = columns.filter((c) => !EXPORTABLE_COLUMNS[c]);
  if (invalidColumns.length > 0) {
    throw new ApiError(400, `Invalid column(s): ${invalidColumns.join(", ")}`);
  }

  const filter: FilterQuery<ITransaction> = {};

  if (filters.search) {
    const regex = new RegExp(filters.search.trim(), "i");
    filter.$or = [{ user_id: regex }, { category: regex }, { status: regex }];
  }
  if (filters.category && filters.category !== "All") filter.category = filters.category;
  if (filters.status && filters.status !== "All") filter.status = filters.status;
  if (filters.user_id && filters.user_id !== "All") filter.user_id = filters.user_id;
  if (filters.dateFrom || filters.dateTo) {
    filter.date = {};
    if (filters.dateFrom) filter.date.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) filter.date.$lte = new Date(filters.dateTo);
  }
  if (filters.amountMin || filters.amountMax) {
    filter.amount = {};
    if (filters.amountMin) filter.amount.$gte = Number(filters.amountMin);
    if (filters.amountMax) filter.amount.$lte = Number(filters.amountMax);
  }

  // Hard cap to keep exports responsive; documented in the README.
  const MAX_EXPORT_ROWS = 50000;
  const records = await Transaction.find(filter).sort({ date: -1 }).limit(MAX_EXPORT_ROWS).lean();

  if (records.length === 0) {
    throw new ApiError(404, "No transactions match the selected filters. Nothing to export.");
  }

  const fields = columns.map((key) => ({ label: EXPORTABLE_COLUMNS[key], value: key }));

  const shaped = records.map((r) => ({
    id: r.id,
    date: new Date(r.date).toISOString().split("T")[0],
    amount: r.amount.toFixed(2),
    category: r.category,
    status: r.status,
    user_id: r.user_id,
    user_profile: r.user_profile,
  }));

  // const parser = new Parser({ fields });
  const csv =toCSV(fields,shaped);

  const safeFileName = (fileName || `transactions_export_${Date.now()}`).replace(
    /[^a-z0-9_\-]/gi,
    "_"
  );

  res.header("Content-Type", "text/csv");
  res.attachment(`${safeFileName}.csv`);
  res.status(200).send(csv);
});

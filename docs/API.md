# API Documentation — Loopr Financial Analytics Dashboard

Base URL (local): `http://localhost:5000/api`

All responses follow the shape:

```json
{ "success": true, "data": { ... } }
```
or on error:
```json
{ "success": false, "message": "Human readable error message" }
```

Endpoints marked **Private** require an `Authorization: Bearer <token>` header.

---

## Auth

### `POST /auth/register`
Create a new user account.

**Body**
```json
{ "name": "Jane Analyst", "email": "jane@loopr.dev", "password": "SecurePass1" }
```

**201 Response**
```json
{
  "success": true,
  "data": {
    "user": { "id": "66f...", "name": "Jane Analyst", "email": "jane@loopr.dev", "role": "analyst" },
    "token": "eyJhbGciOi..."
  }
}
```

**Errors**: `400` missing fields · `409` email already registered

---

### `POST /auth/login`
Authenticate and receive a JWT.

**Body**
```json
{ "email": "admin@loopr.dev", "password": "Admin@12345" }
```

**200 Response** — same shape as register.

**Errors**: `400` missing fields · `401` invalid credentials

---

### `GET /auth/me` — *Private*
Returns the currently authenticated user's profile.

**200 Response**
```json
{ "success": true, "data": { "id": "66f...", "name": "Admin User", "email": "admin@loopr.dev", "role": "admin" } }
```

---

## Transactions

### `GET /transactions` — *Private*
Paginated, filtered, sorted, searchable transaction list.

**Query params** (all optional)

| Param | Type | Notes |
|---|---|---|
| `page` | number | default `1` |
| `limit` | number | default `10`, max `100` |
| `sortBy` | `date` \| `amount` \| `category` \| `status` \| `user_id` | default `date` |
| `sortOrder` | `asc` \| `desc` | default `desc` |
| `search` | string | matches against `user_id`, `category`, `status` (case-insensitive) |
| `category` | `Revenue` \| `Expense` \| `All` | |
| `status` | `Paid` \| `Pending` \| `All` | |
| `user_id` | string \| `All` | |
| `dateFrom` | ISO date string | inclusive |
| `dateTo` | ISO date string | inclusive |
| `amountMin` | number | |
| `amountMax` | number | |

**Example**
```
GET /transactions?page=1&limit=10&sortBy=amount&sortOrder=desc&category=Revenue&status=Paid
```

**200 Response**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "date": "2024-01-15T08:34:12.000Z",
      "amount": 1500,
      "category": "Revenue",
      "status": "Paid",
      "user_id": "user_001",
      "user_profile": "https://..."
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 300, "totalPages": 30 }
}
```

---

### `GET /transactions/filters` — *Private*
Distinct values for populating filter dropdowns.

**200 Response**
```json
{
  "success": true,
  "data": {
    "categories": ["Revenue", "Expense"],
    "statuses": ["Paid", "Pending"],
    "users": ["user_001", "user_002", "user_003", "user_004"]
  }
}
```

---

### `GET /transactions/summary` — *Private*
KPIs + chart data. Accepts the **same filter query params** as `GET /transactions` (excluding pagination/sorting), so the dashboard reflects whatever filters are currently applied.

**200 Response**
```json
{
  "success": true,
  "data": {
    "kpis": {
      "totalRevenue": 125000.50,
      "totalExpense": 87500.25,
      "netBalance": 37500.25,
      "totalTransactions": 300,
      "pendingCount": 42
    },
    "monthlyTrend": [
      { "month": "2024-01", "Revenue": 2200, "Expense": 700 }
    ],
    "categoryBreakdown": [
      { "category": "Revenue", "total": 125000.50, "count": 150 },
      { "category": "Expense", "total": 87500.25, "count": 150 }
    ],
    "statusBreakdown": [
      { "status": "Paid", "total": 180000, "count": 258 },
      { "status": "Pending", "total": 32500.75, "count": 42 }
    ]
  }
}
```

---

## Export

### `GET /export/columns` — *Private*
Returns the list of columns available for CSV export, used to render the export modal dynamically.

**200 Response**
```json
{
  "success": true,
  "data": [
    { "key": "id", "label": "Transaction ID" },
    { "key": "date", "label": "Date" },
    { "key": "amount", "label": "Amount" },
    { "key": "category", "label": "Category" },
    { "key": "status", "label": "Status" },
    { "key": "user_id", "label": "User ID" },
    { "key": "user_profile", "label": "User Profile" }
  ]
}
```

---

### `POST /export/csv` — *Private*
Generates a CSV file for download using the selected columns (in the given order) and filters.

**Body**
```json
{
  "columns": ["date", "user_id", "category", "status", "amount"],
  "filters": {
    "category": "Revenue",
    "status": "Paid",
    "dateFrom": "2024-01-01",
    "dateTo": "2024-06-30"
  },
  "fileName": "revenue_h1_2024"
}
```

**200 Response**: raw CSV file (`Content-Type: text/csv`, `Content-Disposition: attachment; filename="revenue_h1_2024.csv"`)

**Errors**:
- `400` no columns selected, or an unrecognized column key
- `404` no transactions match the given filters (nothing to export)

**Limits**: exports are capped at 50,000 rows per request to keep the endpoint responsive; adjust `MAX_EXPORT_ROWS` in `export.controller.ts` if needed.

---

## Health check

### `GET /health`
Public, unauthenticated. Useful for uptime checks after deployment.

```json
{ "success": true, "message": "API is healthy", "timestamp": "2026-09-12T10:00:00.000Z" }
```

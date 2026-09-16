import {
  TextField,
  MenuItem,
  InputAdornment,
  Paper,
  Grid,
  Button,
  Collapse,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Search, FilterAltOutlined, RestartAlt, ExpandMore, ExpandLess } from "@mui/icons-material";
import { useState } from "react";
import { TransactionFilters } from "../types";

interface FilterBarProps {
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
  categories: string[];
  statuses: string[];
  users: string[];
}

const emptyFilters: TransactionFilters = {
  search: "",
  category: "All",
  status: "All",
  user_id: "All",
  dateFrom: "",
  dateTo: "",
  amountMin: "",
  amountMax: "",
};

const FilterBar = ({ filters, onChange, categories, statuses, users }: FilterBarProps) => {
  const [expanded, setExpanded] = useState(false);

  const update = (patch: Partial<TransactionFilters>) => onChange({ ...filters, ...patch });

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => value && value !== "All" && key !== "search"
  ).length;

  return (
    <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={5}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by user, category, or status..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <TextField
            select
            fullWidth
            size="small"
            label="Category"
            value={filters.category}
            onChange={(e) => update({ category: e.target.value })}
          >
            <MenuItem value="All">All Categories</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={6} md={2}>
          <TextField
            select
            fullWidth
            size="small"
            label="Status"
            value={filters.status}
            onChange={(e) => update({ status: e.target.value })}
          >
            <MenuItem value="All">All Statuses</MenuItem>
            {statuses.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={6} md={2}>
          <TextField
            select
            fullWidth
            size="small"
            label="User"
            value={filters.user_id}
            onChange={(e) => update({ user_id: e.target.value })}
          >
            <MenuItem value="All">All Users</MenuItem>
            {users.map((u) => (
              <MenuItem key={u} value={u}>
                {u}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={6} md={1}>
          <Tooltip title="More filters">
            <IconButton onClick={() => setExpanded((e) => !e)} color={activeFilterCount > 0 ? "primary" : "default"}>
              <FilterAltOutlined />
              {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Grid>
      </Grid>

      <Collapse in={expanded}>
        <Grid container spacing={2} mt={0.5}>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Date from"
              InputLabelProps={{ shrink: true }}
              value={filters.dateFrom}
              onChange={(e) => update({ dateFrom: e.target.value })}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Date to"
              InputLabelProps={{ shrink: true }}
              value={filters.dateTo}
              onChange={(e) => update({ dateTo: e.target.value })}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Min amount"
              value={filters.amountMin}
              onChange={(e) => update({ amountMin: e.target.value })}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Max amount"
              value={filters.amountMax}
              onChange={(e) => update({ amountMax: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              startIcon={<RestartAlt />}
              onClick={() => onChange(emptyFilters)}
              color="inherit"
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Collapse>
    </Paper>
  );
};

export { emptyFilters };
export default FilterBar;

import { Router } from "express";
import {
  getTransactions,
  getFilterOptions,
  getSummary,
} from "../controllers/transaction.controller";
import { protect } from "../middleware/auth";

const router = Router();

router.use(protect);

router.get("/", getTransactions);
router.get("/filters", getFilterOptions);
router.get("/summary", getSummary);

export default router;

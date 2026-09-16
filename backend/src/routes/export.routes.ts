import { Router } from "express";
import { getExportColumns, exportCSV } from "../controllers/export.controller";
import { protect } from "../middleware/auth";

const router = Router();

router.use(protect);

router.get("/columns", getExportColumns);
router.post("/csv", exportCSV);

export default router;

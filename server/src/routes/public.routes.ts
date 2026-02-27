import { Router } from "express";
import { getBooksController, getBookByIdController } from "../controllers/book.controller";
import { getCategoriesController } from "../controllers/category.controller";
import {
  claimPairingCodeController,
  consumeReaderUsageController,
  getReaderContextController,
} from "../controllers/publicReader.controller";
import {
  applyReaderAgeFilter,
  attachReaderContext,
  enforceReaderDailyLimit,
  requirePairedReaderDevice,
} from "../middlewares/readerGuard.middleware";
import { validate } from "../utils/validation.util";
import { claimPairingCodeSchema, consumeReaderUsageSchema } from "../utils/parentValidation.util";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

// Public pairing routes - no authentication required
router.post("/pairing/claim", validate(claimPairingCodeSchema), claimPairingCodeController);

// Reader routes - require a paired reader device context
router.use(attachReaderContext);
router.get("/reader/context", getReaderContextController);
router.post(
  "/reader/usage",
  requirePairedReaderDevice,
  validate(consumeReaderUsageSchema),
  consumeReaderUsageController
);
router.get("/books", requirePairedReaderDevice, applyReaderAgeFilter, getBooksController);
router.get("/books/:id", requirePairedReaderDevice, enforceReaderDailyLimit, getBookByIdController, protect);
router.get("/categories", requirePairedReaderDevice, getCategoriesController);

export default router;

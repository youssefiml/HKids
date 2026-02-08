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

const router = Router();

// Public pairing routes - no authentication required
router.post("/pairing/claim", validate(claimPairingCodeSchema), claimPairingCodeController);

// Reader routes - still public, but restrictions are applied when a paired device is provided
router.use(attachReaderContext);
router.get("/reader/context", getReaderContextController);
router.post(
  "/reader/usage",
  requirePairedReaderDevice,
  validate(consumeReaderUsageSchema),
  consumeReaderUsageController
);
router.get("/books", applyReaderAgeFilter, getBooksController);
router.get("/books/:id", enforceReaderDailyLimit, getBookByIdController);
router.get("/categories", getCategoriesController);

export default router;

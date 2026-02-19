import { Router } from "express";
import { authRateLimiter } from "../middlewares/rateLimit.middleware";
import { protectParent } from "../middlewares/parentAuth.middleware";
import { validate } from "../utils/validation.util";
import {
  parentLoginSchema,
  parentPasswordUpdateSchema,
  parentProfileUpdateSchema,
  parentRegisterSchema,
} from "../utils/parentValidation.util";
import {
  parentLoginController,
  parentMeController,
  parentRegisterController,
  updateParentPasswordController,
  updateParentMeController,
} from "../controllers/parentAuth.controller";

const router = Router();

router.post("/register", authRateLimiter, validate(parentRegisterSchema), parentRegisterController);
router.post("/login", authRateLimiter, validate(parentLoginSchema), parentLoginController);
router.get("/me", protectParent, parentMeController);
router.patch("/me", protectParent, validate(parentProfileUpdateSchema), updateParentMeController);
router.patch("/me/password", protectParent, validate(parentPasswordUpdateSchema), updateParentPasswordController);

export default router;

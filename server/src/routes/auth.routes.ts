import { Router } from "express";
import {
  loginController,
  logoutController,
  meController,
  registerController,
} from "../controllers/auth.controller";
import { validate, loginSchema, registerSchema } from "../utils/validation.util";
import { authRateLimiter } from "../middlewares/rateLimit.middleware";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.post("/login", authRateLimiter, validate(loginSchema), loginController);
router.post("/register", authRateLimiter, validate(registerSchema), registerController);
router.get("/me", protect, meController);
router.post("/logout", protect, logoutController);

export default router;

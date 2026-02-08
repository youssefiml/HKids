import { Request, Response, NextFunction } from "express";
import { UserRole } from "../modules/users/user.model";
import { verifyToken } from "../utils/jwt.util";
import { AppError } from "./error.middleware";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
  readerContext?: {
    isPaired: boolean;
    deviceId: string;
    deviceMongoId?: string;
    parentId?: string;
    childProfileId?: string;
    childName?: string;
    childAge?: number;
    dailyLimitMinutes?: number;
    usedMinutes?: number;
    remainingMinutes?: number;
    isLocked?: boolean;
  };
}

const getBearerToken = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
};

export const protect = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    return next(new AppError("Authentication required", 401));
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch (_error) {
    return next(new AppError("Invalid or expired token", 401));
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError("Insufficient permissions", 403));
    }

    return next();
  };
};

export const authenticate = protect;

import { Request, Response, NextFunction } from "express";
import { verifyParentToken } from "../utils/parentJwt.util";
import { AppError } from "./error.middleware";

export interface ParentAuthRequest extends Request {
  parent?: {
    id: string;
    email: string;
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

export const protectParent = (req: ParentAuthRequest, _res: Response, next: NextFunction) => {
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    return next(new AppError("Parent authentication required", 401));
  }

  try {
    const payload = verifyParentToken(token);
    req.parent = {
      id: payload.id,
      email: payload.email,
    };
    return next();
  } catch (_error) {
    return next(new AppError("Invalid or expired parent token", 401));
  }
};


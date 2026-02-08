import jwt, { SignOptions } from "jsonwebtoken";
import { UserRole } from "../modules/users/user.model";

export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
}

const JWT_ISSUER = "hkids-api";
const JWT_AUDIENCE = "hkids-backoffice";

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET must be set in environment variables");
  }

  if (process.env.NODE_ENV === "production" && secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }

  return secret;
};

const getJwtExpiresIn = (): SignOptions["expiresIn"] => {
  return (process.env.JWT_EXPIRES_IN || "12h") as SignOptions["expiresIn"];
};

export const signToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: getJwtExpiresIn(),
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
};

export const verifyToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, getJwtSecret(), {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });

  if (typeof decoded !== "object" || !decoded.id || !decoded.email || !decoded.role) {
    throw new Error("Invalid token payload");
  }

  return {
    id: String(decoded.id),
    email: String(decoded.email),
    role: decoded.role as UserRole,
  };
};

export const generateToken = signToken;

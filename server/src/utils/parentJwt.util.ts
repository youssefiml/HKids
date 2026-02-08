import jwt, { SignOptions } from "jsonwebtoken";

export interface ParentTokenPayload {
  id: string;
  email: string;
  type: "parent";
}

const JWT_ISSUER = "hkids-api";
const JWT_AUDIENCE = "hkids-parent";

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
  return (process.env.PARENT_JWT_EXPIRES_IN || process.env.JWT_EXPIRES_IN || "12h") as SignOptions["expiresIn"];
};

export const signParentToken = (payload: Omit<ParentTokenPayload, "type">): string => {
  return jwt.sign(
    {
      ...payload,
      type: "parent",
    },
    getJwtSecret(),
    {
      expiresIn: getJwtExpiresIn(),
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }
  );
};

export const verifyParentToken = (token: string): ParentTokenPayload => {
  const decoded = jwt.verify(token, getJwtSecret(), {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });

  if (typeof decoded !== "object" || !decoded.id || !decoded.email || decoded.type !== "parent") {
    throw new Error("Invalid parent token payload");
  }

  return {
    id: String(decoded.id),
    email: String(decoded.email),
    type: "parent",
  };
};


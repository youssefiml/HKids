import { Request, Response, NextFunction } from "express";

type RequestBucket = { count: number; resetTime: number };
type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
  message: string;
  keyGenerator?: (req: Request) => string;
};

const createRateLimiter = (config: RateLimitConfig) => {
  const requestCounts = new Map<string, RequestBucket>();

  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of requestCounts.entries()) {
      if (now > value.resetTime) {
        requestCounts.delete(key);
      }
    }
  }, config.windowMs);

  return (req: Request, res: Response, next: NextFunction) => {
    const key =
      config.keyGenerator?.(req) ??
      req.ip ??
      req.socket.remoteAddress ??
      "unknown";
    const now = Date.now();
    const bucket = requestCounts.get(key);

    if (!bucket || now > bucket.resetTime) {
      requestCounts.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return next();
    }

    if (bucket.count >= config.maxRequests) {
      return res.status(429).json({
        success: false,
        message: config.message,
      });
    }

    bucket.count += 1;
    return next();
  };
};

export const rateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
  message: "Too many requests, please try again later",
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message: "Too many authentication attempts, please try again later",
  keyGenerator: (req) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "anonymous";
    return `${ip}:${email}:${req.path}`;
  },
});

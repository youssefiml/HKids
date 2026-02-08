import { Request, Response, NextFunction } from "express";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  // Log request
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);

  // Log response when finished
  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? "❌" : "✅";
    console.log(
      `${statusColor} [${timestamp}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};

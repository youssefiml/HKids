import { Request, Response, NextFunction } from "express";
import { AppError } from "./error.middleware";
import { getReaderContextByDeviceId } from "../services/devicePairing.service";

const getDeviceIdFromRequest = (req: Request): string | null => {
  const headerDeviceId = req.headers["x-device-id"];
  if (typeof headerDeviceId === "string" && headerDeviceId.trim()) {
    return headerDeviceId.trim();
  }

  const queryDeviceId = req.query.deviceId;
  if (typeof queryDeviceId === "string" && queryDeviceId.trim()) {
    return queryDeviceId.trim();
  }

  return null;
};

export const attachReaderContext = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const deviceId = getDeviceIdFromRequest(req);
    if (!deviceId) {
      return next();
    }

    const context = await getReaderContextByDeviceId(deviceId);
    if (context) {
      req.readerContext = context;
    } else {
      req.readerContext = {
        isPaired: false,
        deviceId,
      };
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

export const applyReaderAgeFilter = (req: Request, _res: Response, next: NextFunction) => {
  if (req.readerContext?.isPaired && req.readerContext.childAge !== undefined) {
    req.query.age = String(req.readerContext.childAge);
  }
  return next();
};

export const requirePairedReaderDevice = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.readerContext?.isPaired || !req.readerContext.deviceId) {
    return next(new AppError("Paired device is required. Provide x-device-id header.", 400));
  }
  return next();
};

export const enforceReaderDailyLimit = (req: Request, _res: Response, next: NextFunction) => {
  if (req.readerContext?.isPaired && (req.readerContext.remainingMinutes ?? 0) <= 0) {
    return next(new AppError("Daily reading limit reached for this child profile", 423));
  }
  return next();
};


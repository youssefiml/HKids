import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { sendSuccess } from "../utils/response.util";
import {
  claimPairingCode,
  consumeReadingMinutes,
  getReaderUsageSummary,
} from "../services/devicePairing.service";
import { AppError } from "../middlewares/error.middleware";

export const claimPairingCodeController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, deviceId, deviceName } = req.body;
    const result = await claimPairingCode(code, deviceId, deviceName);
    sendSuccess(res, result, "Device paired successfully");
  } catch (error) {
    next(error);
  }
};

export const getReaderContextController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.readerContext?.isPaired || !req.readerContext.deviceId) {
      return sendSuccess(res, { paired: false }, "No paired device context");
    }

    const usage = await getReaderUsageSummary(req.readerContext.deviceId);
    return sendSuccess(
      res,
      {
        paired: true,
        deviceId: req.readerContext.deviceId,
        childProfileId: usage.childProfileId,
        childName: usage.childName,
        dailyLimitMinutes: usage.dailyLimitMinutes,
        usedMinutes: usage.usedMinutes,
        remainingMinutes: usage.remainingMinutes,
        isLocked: usage.isLocked,
      },
      "Reader context"
    );
  } catch (error) {
    next(error);
  }
};

export const consumeReaderUsageController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.readerContext?.isPaired || !req.readerContext.deviceId) {
      throw new AppError("Paired device is required", 400);
    }

    const result = await consumeReadingMinutes(req.readerContext.deviceId, req.body.minutes);
    sendSuccess(res, result, "Reader usage tracked");
  } catch (error) {
    next(error);
  }
};


import { Response, NextFunction } from "express";
import { AppError } from "../middlewares/error.middleware";
import { ParentAuthRequest } from "../middlewares/parentAuth.middleware";
import { sendSuccess } from "../utils/response.util";
import {
  assignDeviceToChild,
  createPairingCode,
  listParentDevices,
} from "../services/devicePairing.service";

export const createPairingCodeController = async (req: ParentAuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.parent?.id) {
      throw new AppError("Parent authentication required", 401);
    }

    const pairingCode = await createPairingCode(
      req.parent.id,
      req.body.childProfileId,
      req.body.expiresInMinutes
    );
    sendSuccess(res, pairingCode, "Pairing code created", 201);
  } catch (error) {
    next(error);
  }
};

export const listParentDevicesController = async (req: ParentAuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.parent?.id) {
      throw new AppError("Parent authentication required", 401);
    }

    const devices = await listParentDevices(req.parent.id);
    sendSuccess(res, devices);
  } catch (error) {
    next(error);
  }
};

export const assignDeviceChildController = async (req: ParentAuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.parent?.id) {
      throw new AppError("Parent authentication required", 401);
    }

    const deviceId = Array.isArray(req.params.deviceId) ? req.params.deviceId[0] : req.params.deviceId;
    const device = await assignDeviceToChild(req.parent.id, deviceId, req.body.childProfileId);
    sendSuccess(res, device, "Device child profile updated");
  } catch (error) {
    next(error);
  }
};

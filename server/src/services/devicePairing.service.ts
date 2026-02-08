import { Types } from "mongoose";
import { Device } from "../modules/devices/device.model";
import { PairingCode } from "../modules/pairingCodes/pairingCode.model";
import { AppError } from "../middlewares/error.middleware";
import { assertChildBelongsToParent } from "./childProfile.service";
import { ChildProfile, IChildProfile } from "../modules/children/childProfile.model";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const getDateKeyUtc = (date = new Date()): string => date.toISOString().slice(0, 10);

const generatePairingCodeValue = (): string => {
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    const index = Math.floor(Math.random() * CODE_ALPHABET.length);
    code += CODE_ALPHABET[index];
  }
  return code;
};

const refreshCodeStatusIfExpired = async (pairingCode: any): Promise<void> => {
  if (pairingCode.status !== "pending") {
    return;
  }
  if (pairingCode.expiresAt.getTime() <= Date.now()) {
    pairingCode.status = "expired";
    await pairingCode.save();
  }
};

const ensureDeviceDailyUsageWindow = async (device: any): Promise<void> => {
  const today = getDateKeyUtc();
  if (device.dailyUsageDate !== today) {
    device.dailyUsageDate = today;
    device.dailyUsageMinutes = 0;
    await device.save();
  }
};

const buildReaderContext = async (device: any, childProfile: IChildProfile) => {
  await ensureDeviceDailyUsageWindow(device);

  const limit = childProfile.dailyReadingLimitMinutes;
  const used = device.dailyUsageMinutes;
  const remaining = Math.max(limit - used, 0);

  return {
    isPaired: true as const,
    deviceId: device.deviceId,
    deviceMongoId: device._id.toString(),
    parentId: device.parent.toString(),
    childProfileId: childProfile._id.toString(),
    childName: childProfile.name,
    childAge: childProfile.age,
    dailyLimitMinutes: limit,
    usedMinutes: used,
    remainingMinutes: remaining,
    isLocked: remaining <= 0,
  };
};

export const createPairingCode = async (
  parentId: string,
  childProfileId: string,
  expiresInMinutes: number = 10
) => {
  const childProfile = await assertChildBelongsToParent(parentId, childProfileId);
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generatePairingCodeValue();
    try {
      const pairingCode = await PairingCode.create({
        code,
        parent: new Types.ObjectId(parentId),
        childProfile: childProfile._id,
        status: "pending",
        expiresAt,
      });

      return {
        id: pairingCode._id.toString(),
        code: pairingCode.code,
        expiresAt: pairingCode.expiresAt,
        childProfile: {
          id: childProfile._id.toString(),
          name: childProfile.name,
          age: childProfile.age,
          dailyReadingLimitMinutes: childProfile.dailyReadingLimitMinutes,
        },
      };
    } catch (error: any) {
      if (error?.code !== 11000) {
        throw error;
      }
    }
  }

  throw new AppError("Could not generate pairing code. Please retry.", 500);
};

export const claimPairingCode = async (code: string, deviceId: string, deviceName?: string) => {
  const normalizedCode = code.trim().toUpperCase();
  const normalizedDeviceId = deviceId.trim();

  const pairingCode = await PairingCode.findOne({
    code: normalizedCode,
    status: "pending",
  });

  if (!pairingCode) {
    throw new AppError("Invalid or already used pairing code", 404);
  }

  await refreshCodeStatusIfExpired(pairingCode);
  if (pairingCode.status !== "pending") {
    throw new AppError("Pairing code expired", 410);
  }

  const childProfile = await ChildProfile.findOne({
    _id: pairingCode.childProfile,
    parent: pairingCode.parent,
    isActive: true,
  });
  if (!childProfile) {
    throw new AppError("Child profile for this pairing code is no longer active", 409);
  }

  const existingDevice = await Device.findOne({ deviceId: normalizedDeviceId });
  if (existingDevice && existingDevice.parent.toString() !== pairingCode.parent.toString()) {
    throw new AppError("Device is linked to a different parent account", 409);
  }

  const now = new Date();
  const device =
    existingDevice ??
    new Device({
      deviceId: normalizedDeviceId,
      parent: pairingCode.parent,
      activeChildProfile: childProfile._id,
      pairedAt: now,
      dailyUsageDate: getDateKeyUtc(now),
      dailyUsageMinutes: 0,
    });

  device.parent = pairingCode.parent;
  device.activeChildProfile = childProfile._id;
  device.status = "paired";
  device.deviceName = deviceName?.trim() || device.deviceName || "";
  device.lastSeenAt = now;
  if (!device.pairedAt) {
    device.pairedAt = now;
  }
  await device.save();

  pairingCode.status = "used";
  pairingCode.usedAt = now;
  pairingCode.pairedDeviceId = normalizedDeviceId;
  await pairingCode.save();

  return {
    device: {
      id: device._id.toString(),
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      pairedAt: device.pairedAt,
    },
    childProfile: {
      id: childProfile._id.toString(),
      name: childProfile.name,
      age: childProfile.age,
      dailyReadingLimitMinutes: childProfile.dailyReadingLimitMinutes,
    },
  };
};

export const listParentDevices = async (parentId: string) => {
  const devices = await Device.find({
    parent: new Types.ObjectId(parentId),
  })
    .populate("activeChildProfile", "name age dailyReadingLimitMinutes isActive")
    .sort({ updatedAt: -1 });

  return devices.map((device: any) => ({
    id: device._id.toString(),
    deviceId: device.deviceId,
    deviceName: device.deviceName,
    status: device.status,
    pairedAt: device.pairedAt,
    lastSeenAt: device.lastSeenAt,
    dailyUsageDate: device.dailyUsageDate,
    dailyUsageMinutes: device.dailyUsageMinutes,
    activeChildProfile: device.activeChildProfile,
  }));
};

export const assignDeviceToChild = async (parentId: string, deviceId: string, childProfileId: string) => {
  const childProfile = await assertChildBelongsToParent(parentId, childProfileId);
  const normalizedDeviceId = deviceId.trim();

  const device = await Device.findOne({
    deviceId: normalizedDeviceId,
    parent: new Types.ObjectId(parentId),
  });
  if (!device) {
    throw new AppError("Device not found", 404);
  }

  device.activeChildProfile = childProfile._id;
  device.status = "paired";
  device.lastSeenAt = new Date();
  await device.save();

  return {
    id: device._id.toString(),
    deviceId: device.deviceId,
    activeChildProfile: {
      id: childProfile._id.toString(),
      name: childProfile.name,
      age: childProfile.age,
      dailyReadingLimitMinutes: childProfile.dailyReadingLimitMinutes,
    },
  };
};

export const getReaderContextByDeviceId = async (deviceId: string) => {
  const normalizedDeviceId = deviceId.trim();
  if (!normalizedDeviceId) {
    return null;
  }

  const device = await Device.findOne({
    deviceId: normalizedDeviceId,
    status: "paired",
  });
  if (!device) {
    return null;
  }

  const childProfile = await ChildProfile.findOne({
    _id: device.activeChildProfile,
    parent: device.parent,
    isActive: true,
  });

  if (!childProfile) {
    device.status = "disabled";
    await device.save();
    return null;
  }

  device.lastSeenAt = new Date();
  await device.save();
  return buildReaderContext(device, childProfile);
};

export const consumeReadingMinutes = async (deviceId: string, minutes: number) => {
  const normalizedDeviceId = deviceId.trim();
  if (!normalizedDeviceId) {
    throw new AppError("Device ID is required", 400);
  }

  const requestedMinutes = Math.max(Math.floor(minutes), 0);
  if (requestedMinutes <= 0) {
    throw new AppError("Minutes must be at least 1", 400);
  }

  const device = await Device.findOne({
    deviceId: normalizedDeviceId,
    status: "paired",
  });

  if (!device) {
    throw new AppError("Device is not paired", 404);
  }

  const childProfile = await ChildProfile.findOne({
    _id: device.activeChildProfile,
    parent: device.parent,
    isActive: true,
  });
  if (!childProfile) {
    throw new AppError("Child profile for this device is not active", 409);
  }

  await ensureDeviceDailyUsageWindow(device);

  const limit = childProfile.dailyReadingLimitMinutes;
  const remainingBefore = Math.max(limit - device.dailyUsageMinutes, 0);
  if (remainingBefore <= 0) {
    throw new AppError("Daily reading limit reached", 423);
  }

  const consumedMinutes = Math.min(requestedMinutes, remainingBefore);
  device.dailyUsageMinutes += consumedMinutes;
  device.lastSeenAt = new Date();
  await device.save();

  const remainingAfter = Math.max(limit - device.dailyUsageMinutes, 0);
  return {
    consumedMinutes,
    usedMinutes: device.dailyUsageMinutes,
    remainingMinutes: remainingAfter,
    dailyLimitMinutes: limit,
    isLocked: remainingAfter <= 0,
  };
};

export const getReaderUsageSummary = async (deviceId: string) => {
  const context = await getReaderContextByDeviceId(deviceId);
  if (!context) {
    throw new AppError("Device is not paired", 404);
  }

  return {
    childProfileId: context.childProfileId,
    childName: context.childName,
    usedMinutes: context.usedMinutes,
    remainingMinutes: context.remainingMinutes,
    dailyLimitMinutes: context.dailyLimitMinutes,
    isLocked: context.isLocked,
  };
};

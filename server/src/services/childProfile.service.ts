import { Types } from "mongoose";
import { ChildProfile } from "../modules/children/childProfile.model";
import { Device } from "../modules/devices/device.model";
import { AppError } from "../middlewares/error.middleware";
import { validateObjectId } from "../utils/validators.util";

type ChildProfileInput = {
  name: string;
  age: number;
  dailyReadingLimitMinutes: number;
};

type ChildProfileUpdateInput = Partial<ChildProfileInput> & {
  isActive?: boolean;
};

export const listChildProfiles = async (parentId: string) => {
  return ChildProfile.find({ parent: parentId, isActive: true }).sort({ createdAt: -1 });
};

export const createChildProfile = async (parentId: string, payload: ChildProfileInput) => {
  return ChildProfile.create({
    parent: new Types.ObjectId(parentId),
    name: payload.name.trim(),
    age: payload.age,
    dailyReadingLimitMinutes: payload.dailyReadingLimitMinutes,
  });
};

export const updateChildProfile = async (parentId: string, childProfileId: string, payload: ChildProfileUpdateInput) => {
  validateObjectId(childProfileId, "Child profile ID");

  const childProfile = await ChildProfile.findOne({
    _id: childProfileId,
    parent: new Types.ObjectId(parentId),
    isActive: true,
  });

  if (!childProfile) {
    throw new AppError("Child profile not found", 404);
  }

  if (payload.name !== undefined) {
    childProfile.name = payload.name.trim();
  }
  if (payload.age !== undefined) {
    childProfile.age = payload.age;
  }
  if (payload.dailyReadingLimitMinutes !== undefined) {
    childProfile.dailyReadingLimitMinutes = payload.dailyReadingLimitMinutes;
  }
  if (payload.isActive !== undefined) {
    childProfile.isActive = payload.isActive;
  }

  await childProfile.save();
  return childProfile;
};

export const deactivateChildProfile = async (parentId: string, childProfileId: string) => {
  validateObjectId(childProfileId, "Child profile ID");

  const childProfile = await ChildProfile.findOneAndUpdate(
    {
      _id: childProfileId,
      parent: new Types.ObjectId(parentId),
      isActive: true,
    },
    { isActive: false },
    { new: true }
  );

  if (!childProfile) {
    throw new AppError("Child profile not found", 404);
  }

  await Device.updateMany(
    { parent: new Types.ObjectId(parentId), activeChildProfile: childProfile._id },
    { status: "disabled" }
  );

  return childProfile;
};

export const assertChildBelongsToParent = async (parentId: string, childProfileId: string) => {
  validateObjectId(childProfileId, "Child profile ID");

  const childProfile = await ChildProfile.findOne({
    _id: childProfileId,
    parent: new Types.ObjectId(parentId),
    isActive: true,
  });

  if (!childProfile) {
    throw new AppError("Child profile not found", 404);
  }

  return childProfile;
};


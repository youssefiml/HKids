import bcrypt from "bcrypt";
import { Parent } from "../modules/parents/parent.model";
import { signParentToken } from "../utils/parentJwt.util";
import { AppError } from "../middlewares/error.middleware";

const toPublicParent = (parent: any) => ({
  id: parent._id.toString(),
  fullName: parent.fullName ?? "",
  email: parent.email,
  isActive: parent.isActive,
  createdAt: parent.createdAt,
  updatedAt: parent.updatedAt,
});

export const registerParent = async (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingParent = await Parent.findOne({ email: normalizedEmail });
  if (existingParent) {
    throw new AppError("Email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const parent = await Parent.create({
    fullName: "",
    email: normalizedEmail,
    password: hashedPassword,
  });

  return {
    token: signParentToken({ id: parent._id.toString(), email: parent.email }),
    parent: toPublicParent(parent),
  };
};

export const loginParent = async (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const parent = await Parent.findOne({ email: normalizedEmail, isActive: true }).select("+password");
  if (!parent) {
    throw new AppError("Invalid credentials", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, parent.password);
  if (!isPasswordValid) {
    throw new AppError("Invalid credentials", 401);
  }

  return {
    token: signParentToken({ id: parent._id.toString(), email: parent.email }),
    parent: toPublicParent(parent),
  };
};

export const getParentMe = async (parentId: string) => {
  const parent = await Parent.findOne({ _id: parentId, isActive: true });
  if (!parent) {
    throw new AppError("Parent account not found", 404);
  }
  return toPublicParent(parent);
};

export const updateParentProfile = async (
  parentId: string,
  payload: Partial<{
    fullName: string;
    email: string;
  }>
) => {
  const parent = await Parent.findOne({ _id: parentId, isActive: true });
  if (!parent) {
    throw new AppError("Parent account not found", 404);
  }

  if (payload.fullName !== undefined) {
    parent.fullName = payload.fullName.trim();
  }

  if (payload.email !== undefined) {
    const normalizedEmail = payload.email.trim().toLowerCase();
    if (normalizedEmail !== parent.email) {
      const existingParent = await Parent.findOne({
        email: normalizedEmail,
        _id: { $ne: parent._id },
      });
      if (existingParent) {
        throw new AppError("Email already exists", 409);
      }
      parent.email = normalizedEmail;
    }
  }

  await parent.save();
  return toPublicParent(parent);
};

export const updateParentPassword = async (
  parentId: string,
  currentPassword: string,
  newPassword: string
) => {
  const parent = await Parent.findOne({ _id: parentId, isActive: true }).select("+password");
  if (!parent) {
    throw new AppError("Parent account not found", 404);
  }

  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, parent.password);
  if (!isCurrentPasswordValid) {
    throw new AppError("Current password is incorrect", 401);
  }

  const isSamePassword = await bcrypt.compare(newPassword, parent.password);
  if (isSamePassword) {
    throw new AppError("New password must be different from current password", 400);
  }

  parent.password = await bcrypt.hash(newPassword, 10);
  await parent.save();

  return { updated: true };
};

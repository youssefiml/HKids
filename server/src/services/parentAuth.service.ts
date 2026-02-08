import bcrypt from "bcrypt";
import { Parent } from "../modules/parents/parent.model";
import { signParentToken } from "../utils/parentJwt.util";
import { AppError } from "../middlewares/error.middleware";

const toPublicParent = (parent: any) => ({
  id: parent._id.toString(),
  email: parent.email,
  isActive: parent.isActive,
});

export const registerParent = async (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingParent = await Parent.findOne({ email: normalizedEmail });
  if (existingParent) {
    throw new AppError("Email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const parent = await Parent.create({
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


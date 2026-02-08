import bcrypt from "bcrypt";
import { User } from "../modules/users/user.model";
import { signToken } from "../utils/jwt.util";
import { AppError } from "../middlewares/error.middleware";

const toPublicUser = (user: any) => ({
  id: user._id.toString(),
  email: user.email,
  name: user.name,
  role: user.role,
});

export const login = async (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail, isActive: true }).select("+password");
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError("Invalid credentials", 401);
  }

  const token = signToken({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: toPublicUser(user),
  };
};

export const register = async (email: string, password: string, name: string, role: "admin" | "editor" = "editor") => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError("Email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    email: normalizedEmail,
    password: hashedPassword,
    name,
    role,
  });

  const token = signToken({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: toPublicUser(user),
  };
};

export const getMe = async (userId: string) => {
  const user = await User.findOne({ _id: userId, isActive: true });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  return toPublicUser(user);
};

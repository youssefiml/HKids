import { Schema, model } from "mongoose";

export type UserRole = "admin" | "editor";

export interface IUser {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      index: true,
    },
    password: { type: String, required: true, select: false, minlength: 8 },
    role: { type: String, enum: ["admin", "editor"], default: "editor", index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

UserSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export const User = model<IUser>("User", UserSchema);

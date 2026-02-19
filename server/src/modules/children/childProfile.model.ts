import { Schema, model, Types, Document } from "mongoose";

export interface IChildProfile extends Document {
  parent: Types.ObjectId;
  name: string;
  age: number;
  dailyReadingLimitMinutes: number;
  avatarImageUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChildProfileSchema = new Schema<IChildProfile>(
  {
    parent: {
      type: Types.ObjectId,
      ref: "Parent",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    age: {
      type: Number,
      required: true,
      min: 0,
      max: 18,
      index: true,
    },
    dailyReadingLimitMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 24 * 60,
    },
    avatarImageUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

ChildProfileSchema.index({ parent: 1, name: 1 });

export const ChildProfile = model<IChildProfile>("ChildProfile", ChildProfileSchema);

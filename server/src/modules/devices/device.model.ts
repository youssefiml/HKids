import { Schema, model, Types, Document } from "mongoose";

export type DeviceStatus = "paired" | "disabled";

export interface IDevice extends Document {
  parent: Types.ObjectId;
  activeChildProfile: Types.ObjectId;
  deviceId: string;
  deviceName?: string;
  status: DeviceStatus;
  pairedAt: Date;
  lastSeenAt?: Date;
  dailyUsageDate: string;
  dailyUsageMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceSchema = new Schema<IDevice>(
  {
    parent: {
      type: Types.ObjectId,
      ref: "Parent",
      required: true,
      index: true,
    },
    activeChildProfile: {
      type: Types.ObjectId,
      ref: "ChildProfile",
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 120,
      index: true,
    },
    deviceName: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    status: {
      type: String,
      enum: ["paired", "disabled"],
      default: "paired",
      index: true,
    },
    pairedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    lastSeenAt: {
      type: Date,
    },
    dailyUsageDate: {
      type: String,
      required: true,
      default: () => new Date().toISOString().slice(0, 10),
      maxlength: 10,
    },
    dailyUsageMinutes: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 24 * 60,
    },
  },
  { timestamps: true }
);

DeviceSchema.index({ parent: 1, activeChildProfile: 1 });
DeviceSchema.index({ parent: 1, status: 1 });

export const Device = model<IDevice>("Device", DeviceSchema);


import { Schema, model, Types, Document } from "mongoose";

export type DeviceStatus = "paired" | "disabled";

export interface IDeviceUsageHistoryEntry {
  date: string;
  childProfileId: string;
  minutes: number;
}

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
  usageHistory: IDeviceUsageHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const DeviceUsageHistorySchema = new Schema<IDeviceUsageHistoryEntry>(
  {
    date: {
      type: String,
      required: true,
      maxlength: 10,
    },
    childProfileId: {
      type: String,
      required: true,
      maxlength: 24,
    },
    minutes: {
      type: Number,
      required: true,
      min: 0,
      max: 24 * 60,
    },
  },
  { _id: false }
);

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
    usageHistory: {
      type: [DeviceUsageHistorySchema],
      default: [],
    },
  },
  { timestamps: true }
);

DeviceSchema.index({ parent: 1, activeChildProfile: 1 });
DeviceSchema.index({ parent: 1, status: 1 });

export const Device = model<IDevice>("Device", DeviceSchema);

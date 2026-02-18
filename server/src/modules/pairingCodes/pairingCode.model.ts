import { Schema, model, Types, Document } from "mongoose";

export type PairingCodeStatus = "pending" | "used" | "expired" | "revoked";

export interface IPairingCode extends Document {
  code: string;
  parent: Types.ObjectId;
  childProfile: Types.ObjectId;
  status: PairingCodeStatus;
  expiresAt: Date;
  usedAt?: Date;
  pairedDeviceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PairingCodeSchema = new Schema<IPairingCode>(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      minlength: 4,
      maxlength: 4,
      match: [/^\d{4}$/, "Pairing code must be exactly 4 digits"],
      index: true,
    },
    parent: {
      type: Types.ObjectId,
      ref: "Parent",
      required: true,
      index: true,
    },
    childProfile: {
      type: Types.ObjectId,
      ref: "ChildProfile",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "used", "expired", "revoked"],
      default: "pending",
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedAt: {
      type: Date,
    },
    pairedDeviceId: {
      type: String,
      trim: true,
      maxlength: 120,
    },
  },
  { timestamps: true }
);

PairingCodeSchema.index({ code: 1, status: 1 }, { unique: true, partialFilterExpression: { status: "pending" } });
PairingCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PairingCode = model<IPairingCode>("PairingCode", PairingCodeSchema);

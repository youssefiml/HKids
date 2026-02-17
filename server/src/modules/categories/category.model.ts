import { Schema, model, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  description?: string;
  icon?: string;
  order: number;
  minAge?: number;
  maxAge?: number;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, unique: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    icon: { type: String, default: "" },
    order: { type: Number, default: 0, min: 0 },
    minAge: { type: Number, min: 0, max: 18 },
    maxAge: { type: Number, min: 0, max: 18 },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

// Indexes
CategorySchema.index({ order: 1, name: 1 });

export const Category = model<ICategory>("Category", CategorySchema);

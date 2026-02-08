import { Schema, model, Types, Document } from "mongoose";

export interface IBook extends Document {
  title: string;
  description: string;
  language: string;
  minAge: number;
  maxAge: number;
  categories: Types.ObjectId[];
  coverUrl: string;
  pages?: IPage[];
  status: "draft" | "review" | "published" | "archived";
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPage {
  pageNumber: number;
  imageUrl: string;
  text?: string;
}

const PageSchema = new Schema<IPage>({
  pageNumber: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  text: { type: String, default: "" },
}, { _id: false });

const BookSchema = new Schema<IBook>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", maxlength: 1000 },
    language: { type: String, required: true, trim: true, lowercase: true, enum: ["ar", "en", "fr"] },
    minAge: { type: Number, required: true, min: 0, max: 18 },
    maxAge: { type: Number, required: true, min: 0, max: 18 },
    categories: [{ type: Types.ObjectId, ref: "Category" }],
    coverUrl: { type: String, default: "" },
    pages: [PageSchema],
    status: {
      type: String,
      enum: ["draft", "review", "published", "archived"],
      default: "draft",
      index: true,
    },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for better query performance
BookSchema.index({ status: 1, createdAt: -1 });
BookSchema.index({ minAge: 1, maxAge: 1 });
BookSchema.index({ language: 1 });
BookSchema.index({ categories: 1 });

export const Book = model<IBook>("Book", BookSchema);
import { Schema, model, Types, Document } from "mongoose";

export type StoryStatus = "draft" | "published";
export type StoryLanguage = "ar" | "en" | "fr";

export interface IStory extends Document {
  title: string;
  description: string;
  language: StoryLanguage;
  minAge: number;
  maxAge: number;
  coverImageUrl: string;
  status: StoryStatus;
  publishedAt?: Date | null;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StorySchema = new Schema<IStory>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: "",
      maxlength: 1000,
    },
    language: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      enum: ["ar", "en", "fr"],
    },
    minAge: {
      type: Number,
      required: true,
      min: 0,
      max: 18,
    },
    maxAge: {
      type: Number,
      required: true,
      min: 0,
      max: 18,
    },
    coverImageUrl: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    updatedBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

StorySchema.index({ status: 1, updatedAt: -1 });
StorySchema.index({ language: 1, minAge: 1, maxAge: 1 });

export const Story = model<IStory>("Story", StorySchema);

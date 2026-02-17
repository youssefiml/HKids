import { Schema, model, Types, Document } from "mongoose";

export interface IStoryPage extends Document {
  story: Types.ObjectId;
  order: number;
  imageUrl: string;
  text?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StoryPageSchema = new Schema<IStoryPage>(
  {
    story: {
      type: Types.ObjectId,
      ref: "Story",
      required: true,
      index: true,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
      index: true,
    },
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
    text: {
      type: String,
      default: "",
      maxlength: 600,
    },
  },
  { timestamps: true }
);

StoryPageSchema.index({ story: 1, order: 1 }, { unique: true });

export const StoryPage = model<IStoryPage>("StoryPage", StoryPageSchema);

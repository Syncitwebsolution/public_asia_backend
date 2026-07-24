import mongoose, { Schema } from "mongoose";

const webStorySchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String, 
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
    },
    views: {
      type: Number,
      default: 0,
    },
    articleUrl: {
      type: String,
      trim: true,
      default: "",
    },
    slides: [
      {
        image: { type: String, required: true },
        title: { type: String, default: "" },
        description: { type: String, default: "" },
        articleUrl: { type: String, default: "" },
      },
    ],
  },
  {
    timestamps: true,
  },
);

export const WebStory = mongoose.model("WebStory", webStorySchema);

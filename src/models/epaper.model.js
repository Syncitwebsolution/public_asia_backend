import mongoose, { Schema } from "mongoose";

const ePaperPageSchema = new Schema({
  imageUrl: {
    type: String,
    required: true,
  },
  pageNumber: {
    type: Number,
    required: true,
  }
});

const ePaperSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    pages: [ePaperPageSchema],
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
    },
  },
  {
    timestamps: true,
  },
);

export const EPaper = mongoose.model("EPaper", ePaperSchema);

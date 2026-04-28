import { EPaper } from "../models/epaper.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

// ==================== CREATE EPAPER ====================
const createEPaper = asyncHandler(async (req, res) => {
  const { title, date, status } = req.body;

  if (!title || !date) {
    throw new ApiError(400, "Title and date are required");
  }

  // Check if epaper for this date already exists
  const existing = await EPaper.findOne({ date: new Date(date) });
  if (existing) {
    throw new ApiError(400, "EPaper for this date already exists");
  }

  const thumbnailLocalPath = req.file?.path;
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail image is required");
  }

  const uploaded = await uploadOnCloudinary(thumbnailLocalPath);
  if (!uploaded) throw new ApiError(400, "Thumbnail upload failed");

  const epaper = await EPaper.create({
    title,
    date: new Date(date),
    status: status || "DRAFT",
    thumbnail: uploaded.url,
    pages: [] // Pages will be added via separate endpoint or update
  });

  return res
    .status(201)
    .json(new ApiResponse(201, epaper, "EPaper created successfully"));
});

// ==================== GET ALL EPAPERS (Editions List) ====================
const getEPapers = asyncHandler(async (req, res) => {
  const epapers = await EPaper.find({ status: "PUBLISHED" })
    .select("date title thumbnail")
    .sort({ date: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, epapers, "EPapers fetched successfully"));
});

// ==================== GET EPAPER BY DATE ====================
const getEPaperByDate = asyncHandler(async (req, res) => {
  const { date } = req.params;
  
  const searchDate = new Date(date);
  if (isNaN(searchDate.getTime())) {
    throw new ApiError(400, "Invalid date format");
  }

  const epaper = await EPaper.findOne({
    date: {
      $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
      $lte: new Date(searchDate.setHours(23, 59, 59, 999))
    },
    status: "PUBLISHED"
  });

  if (!epaper) throw new ApiError(404, "EPaper not found for this date");

  return res
    .status(200)
    .json(new ApiResponse(200, epaper, "EPaper fetched successfully"));
});

// ==================== ADD PAGES TO EPAPER ====================
const addEPaperPages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const files = req.files; // Array of files

  if (!files || files.length === 0) {
    throw new ApiError(400, "No pages uploaded");
  }

  const epaper = await EPaper.findById(id);
  if (!epaper) throw new ApiError(404, "EPaper not found");

  const uploadPromises = files.map(file => uploadOnCloudinary(file.path));
  const results = await Promise.all(uploadPromises);

  results.forEach((uploaded, index) => {
    if (uploaded) {
      epaper.pages.push({
        imageUrl: uploaded.url,
        pageNumber: epaper.pages.length + 1
      });
    }
  });

  await epaper.save();

  return res
    .status(200)
    .json(new ApiResponse(200, epaper, "Pages added successfully"));
});

// ==================== DELETE EPAPER ====================
const deleteEPaper = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid EPaper ID");
  }

  const epaper = await EPaper.findByIdAndDelete(id);
  if (!epaper) throw new ApiError(404, "EPaper not found");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "EPaper deleted successfully"));
});

export { 
  createEPaper, 
  getEPapers, 
  getEPaperByDate, 
  addEPaperPages,
  deleteEPaper 
};

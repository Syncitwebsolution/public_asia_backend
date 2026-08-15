import { EPaper } from "../models/epaper.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnImageKit } from "../utils/imagekit.js";
import mongoose from "mongoose";

// ==================== CREATE EPAPER ====================
const createEPaper = asyncHandler(async (req, res) => {
  const { title, date, status } = req.body;

  if (!title || !date) {
    throw new ApiError(400, "Title and date are required");
  }

  const targetDate = new Date(date);
  if (isNaN(targetDate.getTime())) {
    throw new ApiError(400, "Invalid date format");
  }

  const startDate = new Date(targetDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(targetDate);
  endDate.setHours(23, 59, 59, 999);

  // Check if epaper for this date already exists
  const existing = await EPaper.findOne({
    date: { $gte: startDate, $lte: endDate }
  });
  if (existing) {
    throw new ApiError(400, "An E-Paper edition for this date already exists");
  }

  let thumbnailUrl = "";
  let pdfUrl = "";
  const pagesList = [];

  // Handle uploaded files (could be req.file, req.files object or req.files array)
  const filesObj = req.files || {};
  const thumbnailFiles = filesObj.thumbnail || (req.file ? [req.file] : []);
  const pageFiles = filesObj.pages || [];
  const pdfFiles = filesObj.pdf || [];

  // 1. Upload Pages if provided
  if (pageFiles.length > 0) {
    const pageUploadPromises = pageFiles.map((file) => uploadOnImageKit(file.path));
    const pageResults = await Promise.all(pageUploadPromises);

    pageResults.forEach((uploaded, idx) => {
      if (uploaded) {
        pagesList.push({
          imageUrl: uploaded.url,
          pageNumber: idx + 1,
        });
      }
    });
  }

  // 2. Upload Thumbnail (or default to Page 1 image if available)
  if (thumbnailFiles.length > 0 && thumbnailFiles[0].path) {
    const uploadedThumb = await uploadOnImageKit(thumbnailFiles[0].path);
    if (uploadedThumb) thumbnailUrl = uploadedThumb.url;
  } else if (pagesList.length > 0) {
    thumbnailUrl = pagesList[0].imageUrl;
  }

  // 3. Upload PDF if provided
  if (pdfFiles.length > 0 && pdfFiles[0].path) {
    const uploadedPdf = await uploadOnImageKit(pdfFiles[0].path);
    if (uploadedPdf) pdfUrl = uploadedPdf.url;
  }

  if (!thumbnailUrl && pagesList.length === 0 && !pdfUrl) {
    throw new ApiError(400, "Please upload at least a thumbnail image or page images");
  }

  const epaper = await EPaper.create({
    title,
    date: targetDate,
    status: status || "PUBLISHED",
    thumbnail: thumbnailUrl || (pagesList[0] ? pagesList[0].imageUrl : ""),
    pdfUrl: pdfUrl || "",
    pages: pagesList,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, epaper, "E-Paper created successfully"));
});

// ==================== GET ALL EPAPERS (Editions List) ====================
const getEPapers = asyncHandler(async (req, res) => {
  const { all } = req.query; // If admin asks for all (including DRAFT)
  const filter = all === "true" ? {} : { status: "PUBLISHED" };

  const epapers = await EPaper.find(filter)
    .select("date title thumbnail status pdfUrl pages")
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

  const startDate = new Date(searchDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(searchDate);
  endDate.setHours(23, 59, 59, 999);

  const epaper = await EPaper.findOne({
    date: { $gte: startDate, $lte: endDate },
    status: "PUBLISHED",
  });

  if (!epaper) throw new ApiError(404, "EPaper not found for this date");

  // Sort pages by pageNumber
  epaper.pages.sort((a, b) => a.pageNumber - b.pageNumber);

  return res
    .status(200)
    .json(new ApiResponse(200, epaper, "EPaper fetched successfully"));
});

// ==================== ADD PAGES TO EPAPER ====================
const addEPaperPages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const files = req.files?.pages || (Array.isArray(req.files) ? req.files : []);

  if (!files || files.length === 0) {
    throw new ApiError(400, "No pages uploaded");
  }

  const epaper = await EPaper.findById(id);
  if (!epaper) throw new ApiError(404, "EPaper not found");

  const uploadPromises = files.map((file) => uploadOnImageKit(file.path));
  const results = await Promise.all(uploadPromises);

  let currentMaxPage = epaper.pages.length;
  results.forEach((uploaded) => {
    if (uploaded) {
      currentMaxPage += 1;
      epaper.pages.push({
        imageUrl: uploaded.url,
        pageNumber: currentMaxPage,
      });
    }
  });

  // If thumbnail was empty, use first page
  if (!epaper.thumbnail && epaper.pages.length > 0) {
    epaper.thumbnail = epaper.pages[0].imageUrl;
  }

  await epaper.save();

  return res
    .status(200)
    .json(new ApiResponse(200, epaper, "Pages added successfully"));
});

// ==================== DELETE SINGLE EPAPER PAGE ====================
const deleteEPaperPage = asyncHandler(async (req, res) => {
  const { id, pageId } = req.params;

  const epaper = await EPaper.findById(id);
  if (!epaper) throw new ApiError(404, "EPaper not found");

  epaper.pages = epaper.pages.filter((p) => p._id.toString() !== pageId);

  // Re-index page numbers
  epaper.pages.forEach((p, idx) => {
    p.pageNumber = idx + 1;
  });

  await epaper.save();

  return res
    .status(200)
    .json(new ApiResponse(200, epaper, "Page deleted successfully"));
});

// ==================== UPDATE EPAPER ====================
const updateEPaper = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, status, date } = req.body;

  const epaper = await EPaper.findById(id);
  if (!epaper) throw new ApiError(404, "EPaper not found");

  if (title) epaper.title = title;
  if (status) epaper.status = status;
  if (date) epaper.date = new Date(date);

  // If new thumbnail is uploaded
  const thumbnailFile = req.files?.thumbnail?.[0] || req.file;
  if (thumbnailFile?.path) {
    const uploadedThumb = await uploadOnImageKit(thumbnailFile.path);
    if (uploadedThumb) epaper.thumbnail = uploadedThumb.url;
  }

  await epaper.save();

  return res
    .status(200)
    .json(new ApiResponse(200, epaper, "EPaper updated successfully"));
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
  deleteEPaperPage,
  updateEPaper,
  deleteEPaper,
};


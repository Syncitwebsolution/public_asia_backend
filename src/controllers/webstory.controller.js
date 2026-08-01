import { WebStory } from "../models/webstory.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

// Helper to parse slides JSON safely
const parseSlidesJSON = (slidesRaw) => {
  if (!slidesRaw) return [];
  if (Array.isArray(slidesRaw)) return slidesRaw;
  try {
    return JSON.parse(slidesRaw);
  } catch (err) {
    return [];
  }
};

// ==================== CREATE WEBSTORY ====================
const createWebStory = asyncHandler(async (req, res) => {
  const { title, category, status, articleUrl, slides: slidesRaw } = req.body;

  if (!title || !category) {
    throw new ApiError(400, "Title and category are required");
  }

  // Cover image handling
  const coverImageFile = req.files?.image?.[0] || req.file;
  let coverImageUrl = "";
  if (coverImageFile?.path) {
    const uploaded = await uploadOnCloudinary(coverImageFile.path);
    if (uploaded) coverImageUrl = uploaded.secure_url || uploaded.url;
  }

  let parsedSlides = parseSlidesJSON(slidesRaw);

  // Handle uploaded slide images matching index if sent via multipart
  const slideImageFiles = req.files?.slideImages || [];
  if (slideImageFiles.length > 0) {
    for (let i = 0; i < slideImageFiles.length; i++) {
      const file = slideImageFiles[i];
      const uploaded = await uploadOnCloudinary(file.path);
      if (uploaded) {
        if (!parsedSlides[i]) {
          parsedSlides[i] = { image: uploaded.secure_url || uploaded.url };
        } else {
          parsedSlides[i].image = uploaded.secure_url || uploaded.url;
        }
      }
    }
  }

  // Ensure cover image fallback
  if (!coverImageUrl) {
    if (parsedSlides.length > 0 && parsedSlides[0].image) {
      coverImageUrl = parsedSlides[0].image;
    } else {
      throw new ApiError(400, "Story cover image or at least one slide image is required");
    }
  }

  // If no slides provided, default to single slide with story image & title
  if (parsedSlides.length === 0) {
    parsedSlides = [
      {
        image: coverImageUrl,
        title: title,
        description: "",
        articleUrl: articleUrl || "",
      },
    ];
  }

  const story = await WebStory.create({
    title,
    category,
    status: status || "DRAFT",
    image: coverImageUrl,
    articleUrl: articleUrl || "",
    slides: parsedSlides,
  });

  const populatedStory = await WebStory.findById(story._id).populate("category", "name");

  return res
    .status(201)
    .json(new ApiResponse(201, populatedStory, "Web Story created successfully"));
});

// ==================== GET WEBSTORIES ====================
const getWebStories = asyncHandler(async (req, res) => {
  const { status, limit } = req.query;

  const matchCondition = {};
  if (status) matchCondition.status = status;

  let query = WebStory.find(matchCondition)
    .populate("category", "name")
    .sort({ createdAt: -1 });

  if (limit) {
    query = query.limit(parseInt(limit));
  }

  const stories = await query;

  return res
    .status(200)
    .json(new ApiResponse(200, stories, "Web Stories fetched successfully"));
});

// ==================== GET WEBSTORY BY ID ====================
const getWebStoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid WebStory ID");
  }

  const story = await WebStory.findByIdAndUpdate(
    id,
    { $inc: { views: 1 } },
    { new: true }
  ).populate("category", "name");

  if (!story) throw new ApiError(404, "Web Story not found");

  return res
    .status(200)
    .json(new ApiResponse(200, story, "Web Story fetched successfully"));
});

// ==================== UPDATE WEBSTORY ====================
const updateWebStory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, category, status, articleUrl, slides: slidesRaw } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid WebStory ID");
  }

  const story = await WebStory.findById(id);
  if (!story) throw new ApiError(404, "Web Story not found");

  if (title) story.title = title;
  if (category) story.category = category;
  if (status) story.status = status;
  if (articleUrl !== undefined) story.articleUrl = articleUrl;

  const coverImageFile = req.files?.image?.[0] || req.file;
  if (coverImageFile?.path) {
    const uploaded = await uploadOnCloudinary(coverImageFile.path);
    if (uploaded) story.image = uploaded.secure_url || uploaded.url;
  }

  if (slidesRaw) {
    let parsedSlides = parseSlidesJSON(slidesRaw);
    const slideImageFiles = req.files?.slideImages || [];
    if (slideImageFiles.length > 0) {
      for (let i = 0; i < slideImageFiles.length; i++) {
        const file = slideImageFiles[i];
        const uploaded = await uploadOnCloudinary(file.path);
        if (uploaded) {
          if (!parsedSlides[i]) {
            parsedSlides[i] = { image: uploaded.secure_url || uploaded.url };
          } else {
            parsedSlides[i].image = uploaded.secure_url || uploaded.url;
          }
        }
      }
    }
    story.slides = parsedSlides;
  }

  await story.save();
  const populatedStory = await WebStory.findById(story._id).populate("category", "name");

  return res
    .status(200)
    .json(new ApiResponse(200, populatedStory, "Web Story updated successfully"));
});

// ==================== DELETE WEBSTORY ====================
const deleteWebStory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid WebStory ID");
  }

  const story = await WebStory.findById(id);
  if (!story) throw new ApiError(404, "Web Story not found");

  await WebStory.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Web Story deleted successfully"));
});

// ==================== GOOGLE AMP WEB STORY HTML ENDPOINT ====================
const getAMPWebStory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send("Invalid Web Story ID");
  }

  const story = await WebStory.findById(id).populate("category", "name");
  if (!story) return res.status(404).send("Web Story not found");

  const slides = story.slides && story.slides.length > 0 ? story.slides : [
    { image: story.image, title: story.title, description: "", articleUrl: story.articleUrl }
  ];

  const ampPagesHtml = slides.map((slide, idx) => `
    <amp-story-page id="page-${idx + 1}">
      <amp-story-grid-layer template="fill">
        <amp-img src="${slide.image}" width="720" height="1280" layout="responsive" alt="${slide.title || story.title}"></amp-img>
      </amp-story-grid-layer>
      <amp-story-grid-layer template="vertical" class="content-layer">
        <div class="glass-box">
          <span class="category-tag">${story.category?.name || "NEWS"}</span>
          <h2 class="slide-title">${slide.title || story.title}</h2>
          ${slide.description ? `<p class="slide-desc">${slide.description}</p>` : ''}
        </div>
      </amp-story-grid-layer>
      ${slide.articleUrl ? `
        <amp-story-cta-layer>
          <a href="${slide.articleUrl}" class="cta-btn" target="_blank" rel="noopener">पूरी खबर पढ़ें</a>
        </amp-story-cta-layer>
      ` : ''}
    </amp-story-page>
  `).join('');

  const html = `<!doctype html>
<html ⚡ lang="hi">
<head>
  <meta charset="utf-8">
  <title>${story.title} - Public Asia Web Story</title>
  <link rel="canonical" href="${process.env.FRONTEND_URL || 'https://publicasia.in'}/webstory">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
  <style amp-custom>
    amp-story { font-family: 'Helvetica Neue', Arial, sans-serif; color: #fff; }
    .content-layer { justify-content: flex-end; padding: 24px; }
    .glass-box { background: rgba(0, 0, 0, 0.65); backdrop-filter: blur(10px); padding: 18px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.15); }
    .category-tag { background: #ea580c; color: #fff; text-transform: uppercase; font-size: 10px; font-weight: 800; padding: 4px 8px; border-radius: 6px; display: inline-block; margin-bottom: 8px; }
    .slide-title { font-size: 20px; font-weight: 800; line-height: 1.3; margin: 0 0 6px 0; color: #fff; }
    .slide-desc { font-size: 13px; line-height: 1.4; color: #d1d5db; margin: 0; }
    .cta-btn { background: #ea580c; color: #fff; font-weight: 800; text-decoration: none; padding: 12px 24px; border-radius: 30px; text-align: center; display: inline-block; margin: 0 auto; box-shadow: 0 4px 15px rgba(234,88,12,0.4); }
  </style>
</head>
<body>
  <amp-story standalone title="${story.title}" publisher="Public Asia News" publisher-logo-src="https://publicasia.in/logo.png" poster-portrait-src="${story.image}">
    ${ampPagesHtml}
  </amp-story>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  return res.status(200).send(html);
});

export { createWebStory, getWebStories, getWebStoryById, updateWebStory, deleteWebStory, getAMPWebStory };

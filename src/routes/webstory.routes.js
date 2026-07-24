import { Router } from "express";
import {
  createWebStory,
  deleteWebStory,
  getWebStoryById,
  getWebStories,
  updateWebStory,
  getAMPWebStory,
} from "../controllers/webstory.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

const uploadFields = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "slideImages", maxCount: 10 },
]);

// Public routes
router.route("/").get(getWebStories);
router.route("/:id").get(getWebStoryById);
router.route("/:id/amp").get(getAMPWebStory);

// Secured routes
router.use(verifyJWT);
router.use(authorizeRoles("ADMIN", "EDITOR"));

router.route("/").post(uploadFields, createWebStory);

router
  .route("/:id")
  .patch(uploadFields, updateWebStory)
  .delete(deleteWebStory);

export default router;

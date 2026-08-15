import { Router } from "express";
import {
  createEPaper,
  getEPapers,
  getEPaperByDate,
  addEPaperPages,
  deleteEPaperPage,
  updateEPaper,
  deleteEPaper
} from "../controllers/epaper.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

// Public routes
router.route("/").get(getEPapers);
router.route("/:date").get(getEPaperByDate);

// Secured routes (Admin / Editor)
router.use(verifyJWT);
router.use(authorizeRoles("ADMIN", "EDITOR"));

const epaperUpload = upload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "pages", maxCount: 50 },
  { name: "pdf", maxCount: 1 }
]);

router.route("/").post(epaperUpload, createEPaper);
router.route("/:id").put(epaperUpload, updateEPaper);
router.route("/:id").delete(deleteEPaper);
router.route("/:id/pages").post(upload.fields([{ name: "pages", maxCount: 50 }]), addEPaperPages);
router.route("/:id/pages/:pageId").delete(deleteEPaperPage);

export default router;


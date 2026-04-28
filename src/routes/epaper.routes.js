import { Router } from "express";
import {
  createEPaper,
  getEPapers,
  getEPaperByDate,
  addEPaperPages,
  deleteEPaper
} from "../controllers/epaper.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

// Public routes
router.route("/").get(getEPapers);
router.route("/:date").get(getEPaperByDate);

// Secured routes
router.use(verifyJWT);
router.use(authorizeRoles("ADMIN", "EDITOR"));

router.route("/").post(upload.single("thumbnail"), createEPaper);
router.route("/:id/pages").post(upload.array("pages", 20), addEPaperPages);
router.route("/:id").delete(deleteEPaper);

export default router;

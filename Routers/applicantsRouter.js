import { verifyAdminToken } from "../middlewares/verifyAdmin.js";
import express from "express";
import uploads from "../middlewares/uploads.js";
const applicantsRouter = express.Router();


import {
  registerApplicants,
  getApplicants,
} from "../controllers/applicantController.js";

applicantsRouter.post(
  "/registerApplicants",
  uploads.single("image"),
  registerApplicants
);
applicantsRouter.get("/getApplicants", verifyAdminToken, getApplicants);
applicantsRouter.delete("/deleteApplicants", verifyAdminToken, getApplicants);

export { applicantsRouter };

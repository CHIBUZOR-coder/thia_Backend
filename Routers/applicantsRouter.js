import express, { application } from "express";
import { registerApplicants } from "../controllers/applicantController.js";
const applicantsRouter = express.Router();
import uploads from "../middlewares/uploads.js";
applicantsRouter.post("/registerApplicants", uploads.single("image"), registerApplicants);


export { applicantsRouter };

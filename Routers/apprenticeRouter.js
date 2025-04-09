import { verifyAdminToken } from "../middlewares/verifyAdmin.js";
import express from "express";

const apprenticeRouter = express.Router();

import {
  registerApprentice,
  getApprentice,
  deleteApprentice,
  initialisePayment,
  verifyApprenticePyment,
  getSingleApprentice,
} from "../controllers/ApprenticeController.js";

apprenticeRouter.post(
  "/registerApprentice",
  verifyAdminToken,
  registerApprentice
);
apprenticeRouter.get("/getApprentice", verifyAdminToken, getApprentice);
apprenticeRouter.delete(
  "/deleteApprentice",
  verifyAdminToken,
  deleteApprentice
);

apprenticeRouter.post("/apprenticePaynent", initialisePayment);
apprenticeRouter.get("/getSingleApprentice", getSingleApprentice);
apprenticeRouter.post("/verifyApprenticePyment", verifyApprenticePyment);

export { apprenticeRouter };

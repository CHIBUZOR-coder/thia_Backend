import { verifyAdminToken } from "../middlewares/verifyAdmin.js";
import express from "express";
import { verifyToken } from "../middlewares/authentication.js";
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
apprenticeRouter.get("/getSingleApprentice", verifyToken, getSingleApprentice);
apprenticeRouter.post("/verifyApprenticePyment", verifyApprenticePyment);

export { apprenticeRouter };

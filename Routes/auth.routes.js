import express from "express";
import { signin, signup, verifyOTP } from "../Controllers/auth.controller.js";

const router = express.Router();

router.post("/signin", signin);
router.post("/signup", signup);
router.post("/verify-otp", verifyOTP);

export default router;

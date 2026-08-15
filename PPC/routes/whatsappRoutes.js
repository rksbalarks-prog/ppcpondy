import express from "express";
import { sendTextMessage } from "../controllers/whatsappController.js";

const router = express.Router();

router.post("/send-text", sendTextMessage);

export default router;
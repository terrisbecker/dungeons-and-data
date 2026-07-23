import { Router } from "express";
import { postLogin, postRegister } from "./auth.controller.js";

// Public routes — mounted BEFORE the global requireAuth gate in app.ts.
export const authRouter = Router();

authRouter.post("/register", postRegister);
authRouter.post("/login", postLogin);

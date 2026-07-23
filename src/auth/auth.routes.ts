import { Router } from "express";
import { requireAuth } from "./auth.middleware.js";
import { getMe, postLogin, postRegister } from "./auth.controller.js";

// Mounted BEFORE the global requireAuth gate in app.ts, so register/login stay
// public. `/me` opts back in to auth explicitly with a route-level requireAuth.
export const authRouter = Router();

authRouter.post("/register", postRegister);
authRouter.post("/login", postLogin);
authRouter.get("/me", requireAuth, getMe);

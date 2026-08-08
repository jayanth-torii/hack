import { Router } from "express";
import { googleLogin, login, logout, refresh, register, me } from "../controllers/auth.controller";
import { authLimiter } from "../config/rateLimits";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { loginSchema, registerSchema } from "../schemas/auth.schema";

export const authRouter = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Create a new account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       201: { description: Account created, sets httpOnly auth cookies }
 *       409: { description: Email already registered }
 */
authRouter.post("/register", authLimiter, validate(registerSchema), register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in with email + password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Logged in, sets httpOnly auth cookies }
 *       401: { description: Invalid credentials }
 */
authRouter.post("/login", authLimiter, validate(loginSchema), login);

/**
 * @openapi
 * /auth/google:
 *   get:
 *     summary: "Start 'Continue with Google' — redirects to Google's consent screen"
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: next
 *         required: false
 *         schema: { type: string }
 *     responses:
 *       302: { description: Redirect to Google's consent screen }
 *       409: { description: Google OAuth not configured on this server }
 */
authRouter.get("/google", googleLogin);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Rotate access/refresh tokens using the refreshToken cookie
 *     tags: [Auth]
 *     responses:
 *       200: { description: New tokens issued }
 *       401: { description: Missing/invalid/revoked refresh token }
 */
authRouter.post("/refresh", authLimiter, refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Revoke the refresh token and clear auth cookies
 *     tags: [Auth]
 *     responses:
 *       204: { description: Logged out }
 */
authRouter.post("/logout", logout);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get the currently authenticated user
 *     tags: [Auth]
 *     responses:
 *       200: { description: Returns the user object }
 *       401: { description: Not authenticated }
 */
authRouter.get("/me", requireAuth, me);

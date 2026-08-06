import { Router } from "express";
import { login, logout, refresh, register } from "@/controllers/auth.controller";
import { authLimiter } from "@/config/rateLimits";
import { validate } from "@/middleware/validate.middleware";
import { loginSchema, registerSchema } from "@/schemas/auth.schema";

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

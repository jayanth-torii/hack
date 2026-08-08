import type { Request, Response } from "express";
import { User } from "@/models/User";
import { ApiError } from "@/utils/apiError";
import { asyncHandler } from "@/utils/asyncHandler";
import { comparePassword, compareToken, hashPassword, hashToken } from "@/utils/bcrypt";
import { clearAuthCookies, setAuthCookies } from "@/utils/cookies";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/utils/jwt";
import { getGoogleLoginUrl, isGoogleCalendarConfigured } from "@/services/calendar/googleCalendar.service";
import type { LoginInput, RegisterInput } from "@/schemas/auth.schema";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as RegisterInput;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const passwordHash = await hashPassword(password);
  const user = await User.create({ email, passwordHash, savedRoadmaps: [] });

  const payload = { userId: user._id.toString(), email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  user.refreshTokenHash = await hashToken(refreshToken);
  await user.save();

  setAuthCookies(res, accessToken, refreshToken);
  req.log?.info({ userId: user._id.toString(), email }, "User registered");
  res.status(201).json({ user: { id: user._id.toString(), email: user.email } });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    req.log?.warn({ email, reason: "unknown_email" }, "Login failed");
    throw ApiError.unauthorized("Invalid email or password");
  }
  if (!user.passwordHash) {
    req.log?.warn({ email, reason: "google_only_account" }, "Login failed");
    throw ApiError.unauthorized("This account uses Google sign-in. Use \"Continue with Google\" instead.");
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    req.log?.warn({ email, reason: "wrong_password" }, "Login failed");
    throw ApiError.unauthorized("Invalid email or password");
  }

  const payload = { userId: user._id.toString(), email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  user.refreshTokenHash = await hashToken(refreshToken);
  await user.save();

  setAuthCookies(res, accessToken, refreshToken);
  req.log?.info({ userId: user._id.toString(), email }, "User logged in");
  res.status(200).json({ user: { id: user._id.toString(), email: user.email } });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken as string | undefined;
  if (!token) {
    req.log?.warn({ reason: "missing_token" }, "Token refresh failed");
    throw ApiError.unauthorized("Missing refresh token");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    req.log?.warn({ reason: "invalid_token" }, "Token refresh failed");
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const user = await User.findById(decoded.userId).select("+refreshTokenHash");
  if (!user?.refreshTokenHash) {
    req.log?.warn({ userId: decoded.userId, reason: "session_revoked" }, "Token refresh failed");
    throw ApiError.unauthorized("Session revoked");
  }

  const matches = await compareToken(token, user.refreshTokenHash);
  if (!matches) {
    req.log?.warn({ userId: decoded.userId, reason: "token_mismatch" }, "Token refresh failed");
    throw ApiError.unauthorized("Session revoked");
  }

  const payload = { userId: user._id.toString(), email: user.email };
  const accessToken = signAccessToken(payload);
  const newRefreshToken = signRefreshToken(payload);
  user.refreshTokenHash = await hashToken(newRefreshToken);
  await user.save();

  setAuthCookies(res, accessToken, newRefreshToken);
  req.log?.info({ userId: user._id.toString() }, "Tokens refreshed");
  res.status(200).json({ user: { id: user._id.toString(), email: user.email } });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken as string | undefined;
  if (token) {
    try {
      const decoded = verifyRefreshToken(token);
      await User.findByIdAndUpdate(decoded.userId, { $unset: { refreshTokenHash: 1 } });
      req.log?.info({ userId: decoded.userId }, "User logged out");
    } catch {
      // token already invalid/expired — nothing to revoke
    }
  }
  clearAuthCookies(res);
  res.status(204).send();
});

/**
 * @openapi
 * /auth/google:
 *   get:
 *     summary: "Redirect to Google's consent screen for 'Continue with Google' sign-in"
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: next
 *         required: false
 *         schema: { type: string }
 *         description: Frontend path to land on after sign-in (default /)
 *     responses:
 *       302: { description: Redirect to Google's consent screen }
 *       409: { description: Google OAuth not configured on this server }
 */
export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  if (!isGoogleCalendarConfigured()) {
    req.log?.warn({ reason: "oauth_not_configured" }, "Google login attempted but OAuth is not configured");
    throw ApiError.conflict(
      "Google OAuth is not configured on this server. Set GOOGLE_CALENDAR_CLIENT_ID/SECRET."
    );
  }

  const next =
    typeof req.query.next === "string" && req.query.next.startsWith("/")
      ? req.query.next.slice(0, 200)
      : "/";
  // The callback dispatches on mode in state: "login" signs the user in,
  // "connect" (with a uid) links Calendar to an already-logged-in account.
  const state = JSON.stringify({ mode: "login", next });
  req.log?.info({ next }, "Google login flow started");
  res.redirect(getGoogleLoginUrl(state));
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized("Not authenticated");
  const user = await User.findById(req.auth.userId);
  if (!user) throw ApiError.unauthorized("User not found");
  res.status(200).json({
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    },
  });
});

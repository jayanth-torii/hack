import type { Request, Response } from "express";
import { User } from "@/models/User";
import { ApiError } from "@/utils/apiError";
import { asyncHandler } from "@/utils/asyncHandler";
import { comparePassword, compareToken, hashPassword, hashToken } from "@/utils/bcrypt";
import { clearAuthCookies, setAuthCookies } from "@/utils/cookies";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/utils/jwt";
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
  res.status(201).json({ user: { id: user._id.toString(), email: user.email } });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) throw ApiError.unauthorized("Invalid email or password");

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized("Invalid email or password");

  const payload = { userId: user._id.toString(), email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  user.refreshTokenHash = await hashToken(refreshToken);
  await user.save();

  setAuthCookies(res, accessToken, refreshToken);
  res.status(200).json({ user: { id: user._id.toString(), email: user.email } });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken as string | undefined;
  if (!token) throw ApiError.unauthorized("Missing refresh token");

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const user = await User.findById(decoded.userId).select("+refreshTokenHash");
  if (!user?.refreshTokenHash) throw ApiError.unauthorized("Session revoked");

  const matches = await compareToken(token, user.refreshTokenHash);
  if (!matches) throw ApiError.unauthorized("Session revoked");

  const payload = { userId: user._id.toString(), email: user.email };
  const accessToken = signAccessToken(payload);
  const newRefreshToken = signRefreshToken(payload);
  user.refreshTokenHash = await hashToken(newRefreshToken);
  await user.save();

  setAuthCookies(res, accessToken, newRefreshToken);
  res.status(200).json({ user: { id: user._id.toString(), email: user.email } });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken as string | undefined;
  if (token) {
    try {
      const decoded = verifyRefreshToken(token);
      await User.findByIdAndUpdate(decoded.userId, { $unset: { refreshTokenHash: 1 } });
    } catch {
      // token already invalid/expired — nothing to revoke
    }
  }
  clearAuthCookies(res);
  res.status(204).send();
});

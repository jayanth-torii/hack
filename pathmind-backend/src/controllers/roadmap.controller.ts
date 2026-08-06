import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/apiError";
import { generateOrGetRoadmap, getRoadmapBySlug } from "@/services/roadmap.service";
import { User } from "@/models/User";
import { Roadmap } from "@/models/Roadmap";
import type { GenerateRoadmapInput } from "@/schemas/roadmap.schema";

export const generateRoadmap = asyncHandler(async (req: Request, res: Response) => {
  const { topic } = req.body as GenerateRoadmapInput;
  const roadmap = await generateOrGetRoadmap(topic);
  res.status(200).json({ roadmap });
});

export const getRoadmap = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params as { slug: string };
  const roadmap = await getRoadmapBySlug(slug);
  if (!roadmap) throw ApiError.notFound("Roadmap not found");
  res.status(200).json({ roadmap });
});

export const getSavedRoadmaps = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const user = await User.findById(userId).populate("savedRoadmaps");
  if (!user) throw ApiError.notFound("User not found");
  res.status(200).json({ roadmaps: user.savedRoadmaps });
});

export const saveRoadmap = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const { id } = req.params as { id: string };

  const roadmap = await Roadmap.findById(id);
  if (!roadmap) throw ApiError.notFound("Roadmap not found");

  await User.findByIdAndUpdate(userId, { $addToSet: { savedRoadmaps: roadmap._id } });
  res.status(200).json({ saved: true, roadmapId: roadmap._id.toString() });
});
